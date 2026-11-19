import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretPaymentStatus, validateExpectedPayment } from '../lib/payments/payment-status.ts';

const payment={
  referenceId:'c4baf9c0-629e-42c7-8e4f-a7bfefbf5620',
  externalId:'AQ_TEST_001',
  amountXof:6500,
  payerMsisdn:'2290154284444'
};
const response={
  externalId:payment.externalId,
  amount:'6500',
  currency:'XOF',
  payer:{partyIdType:'MSISDN',partyId:payment.payerMsisdn},
  status:'SUCCESSFUL',
  financialTransactionId:'MTN-TRANSACTION-001'
};

test('successful payment needs authenticated provider fields',()=>{
  assert.equal(interpretPaymentStatus(payment,response),'paid');
  assert.equal(interpretPaymentStatus(payment,{...response,status:'PENDING'}),'pending');
  assert.equal(interpretPaymentStatus(payment,{...response,status:'FAILED'}),'failed');
});

test('request acceptance alone can never verify payment',()=>{
  assert.equal(interpretPaymentStatus(payment,{status:'SUCCESSFUL'}),'mismatch');
  assert.equal(interpretPaymentStatus(payment,{...response,financialTransactionId:''}),'mismatch');
  assert.equal(interpretPaymentStatus(payment,{...response,status:'202'}),'mismatch');
});

test('reject amount, currency, external ID and payer mismatches',()=>{
  assert.equal(interpretPaymentStatus(payment,{...response,amount:'6501'}),'mismatch');
  assert.equal(interpretPaymentStatus(payment,{...response,currency:'EUR'}),'mismatch');
  assert.equal(interpretPaymentStatus(payment,{...response,externalId:'AQ_OTHER'}),'mismatch');
  assert.equal(interpretPaymentStatus(payment,{...response,payer:{...response.payer,partyId:'2290100000000'}}),'mismatch');
  assert.equal(interpretPaymentStatus(payment,{...response,payer:null}),'mismatch');
});

test('expected amount must be positive XOF integer and MSISDN Benin format',()=>{
  assert.doesNotThrow(()=>validateExpectedPayment(payment));
  assert.throws(()=>validateExpectedPayment({...payment,amountXof:0}));
  assert.throws(()=>validateExpectedPayment({...payment,amountXof:6500.5}));
  assert.throws(()=>validateExpectedPayment({...payment,payerMsisdn:'+2290154284444'}));
  assert.throws(()=>validateExpectedPayment({...payment,referenceId:'not-uuid'}));
});
