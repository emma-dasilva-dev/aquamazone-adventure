import type { ReservationRequest } from './reservation-rules';

/** Configuration approved for physical equipment only; not live availability. */
export type EquipmentType =
  | 'pedalo_single' | 'pedalo_double'
  | 'canoe_single' | 'canoe_double'
  | 'pedal_boat';
export type EquipmentUnit = { id: string; type: EquipmentType; seats: number };
export type BusyAsset = { assetId: string; fromMinute: number; untilMinute: number };

export const EQUIPMENT: readonly EquipmentUnit[] = [
  {id:'PED-S01',type:'pedalo_single',seats:1},{id:'PED-S02',type:'pedalo_single',seats:1},
  {id:'PED-D01',type:'pedalo_double',seats:2},{id:'PED-D02',type:'pedalo_double',seats:2},
  {id:'CAN-S01',type:'canoe_single',seats:1},{id:'CAN-S02',type:'canoe_single',seats:1},
  {id:'CAN-S03',type:'canoe_single',seats:1},{id:'CAN-S04',type:'canoe_single',seats:1},
  {id:'CAN-D01',type:'canoe_double',seats:2},{id:'CAN-D02',type:'canoe_double',seats:2},
  {id:'CAN-D03',type:'canoe_double',seats:2},{id:'CAN-D04',type:'canoe_double',seats:2},
  {id:'PBO-01',type:'pedal_boat',seats:4},{id:'PBO-02',type:'pedal_boat',seats:4}
] as const;

export type AllocationResult =
  | {status:'allocatable'; assetIds:string[]; durationMinutes:number; fromMinute:number; untilMinute:number}
  | {status:'capacity_exceeded'; reason:string}
  | {status:'manual_review'; reason:string};

function parseClock(clock:string): number | null {
  if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clock))return null;
  const [h,m]=clock.split(':').map(Number);
  return h*60+m;
}
function freeUnits(type:EquipmentType, from:number, until:number, busy:readonly BusyAsset[]) {
  return EQUIPMENT.filter(unit=>unit.type===type && !busy.some(block=>
    block.assetId===unit.id && from<block.untilMinute && block.fromMinute<until
  ));
}

/**
 * Produce an allocation suggestion from a snapshot of occupied equipment.
 * This is NOT a reservation or a concurrency-safe hold: check and allocate
 * inside one PostgreSQL transaction, relying on the exclusion constraint.
 */
export function proposeAllocation(
  request: Pick<ReservationRequest,'experience'|'time'|'adults'|'children'|'choice'>,
  busy:readonly BusyAsset[]
): AllocationResult {
  const from=parseClock(request.time);
  const count=request.adults+request.children;
  if(from===null||!Number.isSafeInteger(count)||count<1||count>20)
    return {status:'manual_review',reason:'Invalid guest count or time.'};
  const experience=request.experience;
  if(['guezo','toffa','behanzin','lake','mangrove','paddle','waterball'].includes(experience))
    return {status:'manual_review',reason:'Activity sequencing, supplier inventory or duration requires staff confirmation.'};
  const duration=experience==='waterball'?20:30;
  const until=from+duration;
  if(experience==='glele' && count!==1)
    return {status:'manual_review',reason:'GLÈLÈ requires exactly one participant.'};

  if(experience==='pedalboat'){
    if(count<2||count>4) return {status:'capacity_exceeded',reason:'One pedal-powered boat accommodates 2–4 visitors.'};
    const candidates=freeUnits('pedal_boat',from,until,busy);
    if(candidates.length===0)return {status:'capacity_exceeded',reason:'No pedal-powered boat remains in this time window.'};
    return {status:'allocatable',assetIds:[candidates[0].id],durationMinutes:duration,fromMinute:from,untilMinute:until};
  }

  const family = experience==='glele' ? request.choice : experience;
  if(family!=='pedalo' && family!=='canoe')
    return {status:'manual_review',reason:'Equipment is not defined for this experience.'};

  const singles=freeUnits(family==='pedalo'?'pedalo_single':'canoe_single',from,until,busy);
  const doubles=freeUnits(family==='pedalo'?'pedalo_double':'canoe_double',from,until,busy);

  if(experience==='glele'){
    if(singles.length===0)return {status:'capacity_exceeded',reason:'No single craft is available.'};
    return {status:'allocatable',assetIds:[singles[0].id],durationMinutes:duration,fromMinute:from,untilMinute:until};
  }
  // Use the smallest number of vessels that can carry exactly the guests:
  // double units carry two, singles carry one; no assumed solo use of a double.
  for(let two=Math.min(Math.floor(count/2),doubles.length);two>=0;two--){
    const one=count-two*2;
    if(one>singles.length)continue;
    return {status:'allocatable',assetIds:[
      ...doubles.slice(0,two).map(x=>x.id),
      ...singles.slice(0,one).map(x=>x.id)
    ],durationMinutes:duration,fromMinute:from,untilMinute:until};
  }
  return {status:'capacity_exceeded',reason:'Not enough compatible craft remain in this time window.'};
}
