import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBookingContact } from '../lib/booking-contact.ts';

const valid = {
  fullName: '  Marie   Dupont ',
  phone: '+33 6 12 34 56 78',
  email: '  Marie.Example@Gmail.com  '
};

test('accepts international contact and normalizes it',()=>{
  const result=validateBookingContact(valid);
  assert.equal(result.ok,true);
  if(result.ok)assert.deepEqual(result.contact,{
    fullName:'Marie Dupont',phone:'+33612345678',email:'marie.example@gmail.com'
  });
});

test('accepts Benin and other country dialling codes',()=>{
  for(const phone of ['+229 01 54 28 44 44','+234 803 123 4567','+1 (415) 555-0199','+44 7700 900123']){
    assert.equal(validateBookingContact({...valid,phone}).ok,true,phone);
  }
});

test('rejects local-only or malformed phone formats',()=>{
  for(const phone of ['0154284444','2290154284444','+0001234567','+123','+1234567890123456','+33 6 abc 45 67']){
    const result=validateBookingContact({...valid,phone});
    assert.equal(result.ok,false,phone);
    if(!result.ok)assert.equal(result.field,'phone');
  }
});

test('rejects malformed emails and blank names',()=>{
  for(const email of ['without-at.example.com','a@invalid','a@@example.com','a@domain..com','user @example.com']){
    assert.equal(validateBookingContact({...valid,email}).ok,false,email);
  }
  assert.equal(validateBookingContact({...valid,fullName:'  '}).ok,false);
});

test('rejects dangerous control characters',()=>{
  assert.equal(validateBookingContact({...valid,fullName:'A\nB'}).ok,false);
});

test('syntax checks never pretend to verify ownership',()=>{
  assert.ok(validateBookingContact(valid).ok);
  // A correctly formatted address can still be unreachable or belong to someone else.
});
