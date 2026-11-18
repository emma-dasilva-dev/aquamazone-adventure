import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBookingContact, normalizeBookingEmail } from '../lib/booking-contact.ts';

const valid={fullName:'  Marie   Dupont ',phone:'+33 6 12 34 56 78'};

test('accepts and normalizes name and international WhatsApp number',()=>{
  const result=validateBookingContact(valid);
  assert.equal(result.ok,true);
  if(result.ok)assert.deepEqual(result.contact,{
    fullName:'Marie Dupont',phone:'+33612345678'
  });
});

test('email is not required for WhatsApp reservation enquiries',()=>{
  assert.equal(validateBookingContact({...valid,email:''}).ok,true);
  assert.equal(validateBookingContact(valid).ok,true);
});

test('accepts international country calling codes',()=>{
  for(const phone of ['+229 01 54 28 44 44','+234 803 123 4567','+1 (415) 555-0199','+44 7700 900123']){
    assert.equal(validateBookingContact({...valid,phone}).ok,true,phone);
  }
});

test('rejects missing or malformed international phone numbers',()=>{
  for(const phone of ['','0154284444','2290154284444','+0001234567','+123','+1234567890123456','+33 6 abc 45 67']){
    const result=validateBookingContact({...valid,phone});
    assert.equal(result.ok,false,phone);
    if(!result.ok)assert.equal(result.field,'phone');
  }
});

test('rejects blank names and control characters',()=>{
  assert.equal(validateBookingContact({...valid,fullName:'  '}).ok,false);
  assert.equal(validateBookingContact({...valid,fullName:'A\nB'}).ok,false);
});

test('email normalization remains available for future use, but is not part of booking identity',()=>{
  assert.equal(normalizeBookingEmail('NotAnEmail'),null);
  assert.equal(normalizeBookingEmail('  Hello@Example.com  '),'hello@example.com');
});
