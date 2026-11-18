import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingWindow,checkBookingWindow,validateReservation} from '../lib/reservation-rules.ts';

const request=(date:string)=>({experience:'pedalo',date,time:'12:00',adults:2,children:0});
const benin=(date:string,time:string)=>new Date(date+'T'+time+':00+01:00');

test('Monday opens only the upcoming weekend',()=>{
  const monday=benin('2026-11-16','09:00');
  assert.deepEqual([bookingWindow(monday).saturday,bookingWindow(monday).sunday],['2026-11-21','2026-11-22']);
  assert.equal(checkBookingWindow('2026-11-21',monday).ok,true);
  assert.equal(checkBookingWindow('2026-11-22',monday).ok,true);
  assert.equal(checkBookingWindow('2026-11-28',monday).ok,false);
});

test('Saturday booking closes at Friday 22h Benin time',()=>{
  assert.equal(checkBookingWindow('2026-11-21',benin('2026-11-20','21:59')).ok,true);
  assert.equal(checkBookingWindow('2026-11-21',benin('2026-11-20','22:00')).ok,false);
  assert.equal(checkBookingWindow('2026-11-22',benin('2026-11-20','22:00')).ok,true);
});

test('Sunday booking closes at Saturday 22h, Saturday never accepts same-day requests',()=>{
  assert.equal(checkBookingWindow('2026-11-21',benin('2026-11-21','08:00')).ok,false);
  assert.equal(checkBookingWindow('2026-11-22',benin('2026-11-21','21:59')).ok,true);
  assert.equal(checkBookingWindow('2026-11-22',benin('2026-11-21','22:00')).ok,false);
});

test('Sunday has no new online enquiries; booking reopens on Monday',()=>{
  assert.equal(checkBookingWindow('2026-11-28',benin('2026-11-22','15:00')).ok,false);
  assert.equal(checkBookingWindow('2026-11-28',benin('2026-11-23','00:00')).ok,true);
});

test('Server validation enforces cutoff even if user bypasses calendar',()=>{
  const friday=benin('2026-11-20','22:00');
  const blocked=validateReservation(request('2026-11-21'),friday);
  assert.equal(blocked.ok,false);
  if(!blocked.ok)assert.equal(blocked.code,'saturday_cutoff');
  const sunday=validateReservation(request('2026-11-22'),friday);
  assert.equal(sunday.ok,true);
});

test('Manual admin intake remains allowed for previously arranged weekday and weekend requests',()=>{
  const now=benin('2026-11-20','22:30');
  assert.equal(validateReservation(request('2026-11-21'),now,{manualIntake:true}).ok,true);
  // Admin helper validates package rules against a future Saturday and stores actual weekday separately.
});

test('Invalid dates and weekday online requests are rejected',()=>{
  assert.equal(validateReservation(request('2026-11-31'),benin('2026-11-16','09:00')).ok,false);
  const weekday=validateReservation(request('2026-11-18'),benin('2026-11-16','09:00'));
  assert.equal(weekday.ok,false);
  if(!weekday.ok)assert.equal(weekday.code,'special_day');
});

test('TOFFA is 18,000 FCFA for 2 adults + 2 children including the crossing',()=>{
  const result=validateReservation({...request('2026-11-21'),experience:'toffa',adults:2,children:2},benin('2026-11-16','09:00'));
  assert.equal(result.ok,true);
  if(result.ok){
    assert.equal(result.quote.total,18000);
    assert.equal(result.quote.crossingIncluded,true);
    assert.equal(result.quote.crossingAmount,0);
  }
});

test('BÉHANZIN stays 36,000 FCFA with the crossing included',()=>{
  const result=validateReservation({...request('2026-11-21'),experience:'behanzin',adults:4},benin('2026-11-16','09:00'));
  assert.equal(result.ok,true);
  if(result.ok){
    assert.equal(result.quote.total,36000);
    assert.equal(result.quote.crossingAmount,0);
  }
});

test('Pedal-powered boat accepts 2 to 4 guests and rejects 1 or 5',()=>{
  const now=benin('2026-11-16','09:00');
  for(const adults of [2,3,4]){
    const result=validateReservation({...request('2026-11-21'),experience:'pedalboat',adults},now);
    assert.equal(result.ok,true);
  }
  for(const adults of [1,5]){
    const result=validateReservation({...request('2026-11-21'),experience:'pedalboat',adults},now);
    assert.equal(result.ok,false);
  }
});

test('Mangrove discovery charges adults and under-12s separately, plus mandatory crossing',()=>{
  const result=validateReservation({
    experience:'mangrove',date:'2026-11-21',time:'12:00',adults:2,children:2
  },benin('2026-11-16','09:00'));
  assert.equal(result.ok,true);
  if(result.ok){
    assert.equal(result.quote.crossingIncluded,false);
    assert.equal(result.quote.crossingAmount,4000);
    assert.equal(result.quote.total,19000);
  }
});

test('GLÈLÈ accepts canoe, pedalo or paddle as ONE included 30-minute activity',()=>{
  const now=benin('2026-11-16','09:00');
  for(const choice of ['canoe','pedalo','paddle']){
    const result=validateReservation({
      experience:'glele',date:'2026-11-21',time:'12:00',adults:1,children:0,choice
    },now);
    assert.equal(result.ok,true,choice);
    if(result.ok){
      assert.equal(result.quote.total,5000);
      assert.equal(result.quote.crossingIncluded,true);
      assert.equal(result.reservation.choice,choice);
    }
  }
  assert.equal(validateReservation({
    experience:'glele',date:'2026-11-21',time:'12:00',adults:1,children:0,choice:'all'
  },now).ok,false);
});

test('GLÈLÈ discovery supports a group with individually selected activities',()=>{
  const now=benin('2026-11-16','09:00');
  const result=validateReservation({
    experience:'glele',date:'2026-11-21',time:'12:00',
    adults:2,children:1,choice:'canoe',choices:['canoe','pedalo','paddle']
  },now);
  assert.equal(result.ok,true);
  if(result.ok){
    assert.equal(result.quote.total,13500);
    assert.equal(result.quote.crossingAmount,0);
    assert.deepEqual(result.reservation.choices,['canoe','pedalo','paddle']);
  }
});

test('GLÈLÈ requires an accompanying adult for children',()=>{
  const result=validateReservation({
    experience:'glele',date:'2026-11-21',time:'12:00',
    adults:0,children:1,choice:'paddle',choices:['paddle']
  },benin('2026-11-16','09:00'));
  assert.equal(result.ok,false);
  if(!result.ok)assert.equal(result.code,'accompanying_adult');
});

test('GLÈLÈ rejects incomplete and inconsistent participant activity selections',()=>{
  const base={experience:'glele',date:'2026-11-21',time:'12:00',adults:1,children:1};
  const now=benin('2026-11-16','09:00');
  for(const data of [
    {...base,choice:'canoe'},
    {...base,choice:'canoe',choices:['canoe']},
    {...base,choice:'canoe',choices:['canoe','other']},
    {...base,choice:'pedalo',choices:['canoe','paddle']}
  ]) assert.equal(validateReservation(data,now).ok,false);
});

test('GLÈLÈ price scales with adults and accompanied children',()=>{
  const result=validateReservation({
    experience:'glele',date:'2026-11-21',time:'12:00',
    adults:1,children:1,choice:'pedalo',choices:['pedalo','canoe']
  },benin('2026-11-16','09:00'));
  assert.equal(result.ok,true);
  if(result.ok)assert.equal(result.quote.total,8500);
});
