import 'server-only';
import { Buffer } from 'node:buffer';
import { validateExpectedPayment, interpretPaymentStatus } from './payment-status';
import type { ExpectedPayment, PaymentDecision } from './payment-status';

/**
 * Private MTN Collections adapter. No payment button or public endpoint is
 * enabled until merchant onboarding and durable checkout are complete.
 */
type Configuration = {
  baseUrl: string;
  target: 'sandbox' | 'mtnbenin';
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  callbackUrl?: string;
};

export function mtnPaymentConfigured(): boolean {
  return process.env.MTN_MOMO_ENABLED === 'true' && Boolean(
    process.env.MTN_MOMO_SUBSCRIPTION_KEY &&
    process.env.MTN_MOMO_API_USER &&
    process.env.MTN_MOMO_API_KEY &&
    process.env.MTN_MOMO_ENVIRONMENT
  );
}

function configuration(): Configuration {
  if (!mtnPaymentConfigured()) throw Error('MTN Collections integration is disabled');
  const target=process.env.MTN_MOMO_ENVIRONMENT;
  if (target !== 'sandbox' && target !== 'mtnbenin')
    throw Error('Unsupported MTN target environment');
  const baseUrl=target==='sandbox'
    ?'https://sandbox.momodeveloper.mtn.com'
    :'https://proxy.momoapi.mtn.com';
  const callbackUrl=process.env.MTN_MOMO_CALLBACK_URL || undefined;
  if (callbackUrl) {
    const url=new URL(callbackUrl);
    if (url.protocol !== 'https:' || url.username || url.password ||
        !url.hostname || url.search || url.hash)
      throw Error('MTN callback must be a clean HTTPS URL');
  }
  return {
    baseUrl,target,
    subscriptionKey:process.env.MTN_MOMO_SUBSCRIPTION_KEY!,
    apiUser:process.env.MTN_MOMO_API_USER!,
    apiKey:process.env.MTN_MOMO_API_KEY!,
    callbackUrl
  };
}

async function accessToken(config:Configuration):Promise<string> {
  const credentials=Buffer.from(config.apiUser+':'+config.apiKey).toString('base64');
  const response=await fetch(config.baseUrl+'/collection/token/',{
    method:'POST',
    headers:{
      Authorization:'Basic '+credentials,
      'Ocp-Apim-Subscription-Key':config.subscriptionKey
    },
    cache:'no-store',
    signal:AbortSignal.timeout(10000)
  });
  if(!response.ok)throw Error('MTN token request failed');
  const payload=await response.json() as {access_token?:unknown};
  if(typeof payload.access_token!=='string'||!payload.access_token)
    throw Error('MTN token response invalid');
  return payload.access_token;
}

async function authHeaders(config:Configuration):Promise<Record<string,string>> {
  return {
    Authorization:'Bearer '+await accessToken(config),
    'Ocp-Apim-Subscription-Key':config.subscriptionKey,
    'X-Target-Environment':config.target
  };
}

/**
 * Initiates a payment for an already persisted server-priced XOF intent.
 * Caller MUST reserve an immutable, unique attempt before calling this.
 * Never retry a timed-out request with a different reference ID.
 * 202 Accepted always means PENDING, not paid.
 */
export async function requestMtnPayment(payment:ExpectedPayment):Promise<{referenceId:string;state:'pending'}> {
  validateExpectedPayment(payment);
  const config=configuration();
  if(config.target!=='mtnbenin')
    throw Error('Cannot initiate a real XOF payment in the MTN sandbox');
  const headers=await authHeaders(config);
  const response=await fetch(config.baseUrl+'/collection/v1_0/requesttopay',{
    method:'POST',
    headers:{
      ...headers,
      'Content-Type':'application/json',
      'X-Reference-Id':payment.referenceId,
      ...(config.callbackUrl?{'X-Callback-Url':config.callbackUrl}:{})
    },
    body:JSON.stringify({
      amount:String(payment.amountXof),currency:'XOF',
      externalId:payment.externalId,
      payer:{partyIdType:'MSISDN',partyId:payment.payerMsisdn},
      payerMessage:'Aquamazone',
      payeeNote:'Aquamazone Adventure'
    }),
    cache:'no-store',
    signal:AbortSignal.timeout(15000)
  });
  if(response.status!==202)throw Error('MTN did not accept the payment request');
  return {referenceId:payment.referenceId,state:'pending'};
}

/**
 * Read authenticated MTN status directly, without trusting callbacks.
 * A caller may mark a payment as paid only after an atomic DB write that
 * verifies the same stored intent, reference ID, amount and final status.
 */
export async function checkMtnPayment(payment:ExpectedPayment):Promise<PaymentDecision> {
  validateExpectedPayment(payment);
  const config=configuration();
  if(config.target!=='mtnbenin')
    throw Error('Sandbox status cannot settle a real XOF order');
  const headers=await authHeaders(config);
  const response=await fetch(
    config.baseUrl+'/collection/v1_0/requesttopay/'+encodeURIComponent(payment.referenceId),{
      method:'GET',headers,cache:'no-store',signal:AbortSignal.timeout(10000)
    });
  if(!response.ok)throw Error('MTN status check failed');
  return interpretPaymentStatus(payment,await response.json() as unknown);
}
