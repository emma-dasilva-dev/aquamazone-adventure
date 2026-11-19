/**
 * Pure MTN MoMo Collections payment verification rules.
 * Never trust a callback payload, client redirect, or payment screenshot.
 */
export type ExpectedPayment = {
  referenceId: string;
  externalId: string;
  amountXof: number;
  payerMsisdn: string;
};
export type PaymentDecision = 'pending' | 'paid' | 'failed' | 'mismatch';

type ProviderResponse = Record<string, unknown>;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const msisdn=/^22901\d{8}$/;

export function validateExpectedPayment(payment: ExpectedPayment): void {
  if (!uuid.test(payment.referenceId)) throw Error('Invalid reference ID');
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(payment.externalId)) throw Error('Invalid external ID');
  if (!Number.isSafeInteger(payment.amountXof) || payment.amountXof <= 0)
    throw Error('Invalid XOF amount');
  if (!msisdn.test(payment.payerMsisdn)) throw Error('Expected Benin MSISDN in 22901XXXXXXXX format');
}

export function interpretPaymentStatus(expected: ExpectedPayment, response: unknown): PaymentDecision {
  validateExpectedPayment(expected);
  if (!response || typeof response !== 'object' || Array.isArray(response)) return 'mismatch';
  const result=response as ProviderResponse;
  // Require all transaction identity fields; never default missing data to success.
  if (result.externalId !== expected.externalId ||
      result.currency !== 'XOF' ||
      result.amount !== String(expected.amountXof) && result.amount !== expected.amountXof)
    return 'mismatch';
  const payer=result.payer;
  if (!payer || typeof payer !== 'object' || Array.isArray(payer) ||
      (payer as ProviderResponse).partyIdType !== 'MSISDN' ||
      (payer as ProviderResponse).partyId !== expected.payerMsisdn)
    return 'mismatch';
  if (result.status === 'SUCCESSFUL') {
    // Financial transaction ID supports reconciliation against MTN records.
    if (typeof result.financialTransactionId !== 'string' ||
        !result.financialTransactionId.trim()) return 'mismatch';
    return 'paid';
  }
  if (result.status === 'FAILED') return 'failed';
  if (result.status === 'PENDING') return 'pending';
  return 'mismatch';
}
