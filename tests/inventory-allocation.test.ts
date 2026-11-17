import test from 'node:test';
import assert from 'node:assert/strict';
import { EQUIPMENT, proposeAllocation } from '../lib/inventory-allocation.ts';

const at=(experience:'pedalo'|'canoe'|'pedalboat'|'glele'|'guezo',adults:number,children=0,choice?:'canoe'|'pedalo')=>({
  experience,time:'12:00',adults,children,choice
});

test('physical inventory matches known Aquamazone counts',()=>{
  const counts=EQUIPMENT.reduce<Record<string,number>>((out,unit)=>{out[unit.type]=(out[unit.type]||0)+1;return out;},{});
  assert.deepEqual(counts,{
    pedalo_single:2,pedalo_double:2,canoe_single:4,canoe_double:4,pedal_boat:2
  });
});
test('pédalo pair uses a double and no other vessel',()=>{
  const result=proposeAllocation(at('pedalo',2),[]);
  assert.equal(result.status,'allocatable');
  if(result.status==='allocatable')assert.deepEqual(result.assetIds,['PED-D01']);
});
test('one guest uses a single unit, not a two-person craft',()=>{
  const result=proposeAllocation(at('canoe',1),[]);
  assert.equal(result.status,'allocatable');
  if(result.status==='allocatable')assert.deepEqual(result.assetIds,['CAN-S01']);
});
test('overlapping allocation is excluded',()=>{
  const occupied=[{assetId:'PED-D01',fromMinute:720,untilMinute:750}];
  const result=proposeAllocation(at('pedalo',2),occupied);
  assert.equal(result.status,'allocatable');
  if(result.status==='allocatable')assert.deepEqual(result.assetIds,['PED-D02']);
});
test('half-open intervals allow back-to-back use',()=>{
  const occupied=[{assetId:'PED-D01',fromMinute:690,untilMinute:720}];
  const result=proposeAllocation(at('pedalo',2),occupied);
  assert.equal(result.status,'allocatable');
  if(result.status==='allocatable')assert.deepEqual(result.assetIds,['PED-D01']);
});
test('capacity is not fabricated when all boats are occupied',()=>{
  const occupied=[{assetId:'PBO-01',fromMinute:720,untilMinute:750},{assetId:'PBO-02',fromMinute:720,untilMinute:750}];
  assert.equal(proposeAllocation(at('pedalboat',4),occupied).status,'capacity_exceeded');
});
test('GLÈLÈ needs an available single vessel',()=>{
  const occupied=[{assetId:'PED-S01',fromMinute:720,untilMinute:750},{assetId:'PED-S02',fromMinute:720,untilMinute:750}];
  assert.equal(proposeAllocation(at('glele',1,0,'pedalo'),occupied).status,'capacity_exceeded');
});
test('multi-activity packages require schedule review',()=>{
  assert.equal(proposeAllocation(at('guezo',2),[]).status,'manual_review');
});
