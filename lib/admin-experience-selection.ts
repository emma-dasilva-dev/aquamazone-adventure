/**
 * Administrator-only manual enquiry selection.
 * Standalone activities and an optional forfait are distinct concepts.
 * A single enquiry has one arrival slot, not a guaranteed schedule for each activity.
 */
import {
  RESERVATION_IDS, type ReservationId,
  validateReservation, type ReservationRequest
} from './reservation-rules';

export const ADMIN_ACTIVITIES = [
  'pedalo','canoe','paddle','waterball','pedalboat','lake','mangrove'
] as const;

export const ADMIN_PACKAGES = ['glele','guezo','toffa','behanzin'] as const;

export type AdminActivity = typeof ADMIN_ACTIVITIES[number];
export type AdminPackage = typeof ADMIN_PACKAGES[number];
export type ExperienceSelection = {
  activities: AdminActivity[];
  package: AdminPackage | null;
  choice: 'canoe' | 'pedalo' | null;
};
type SelectionResult =
  | {ok:true; selection:ExperienceSelection; primary:ReservationRequest; quoteAmount:number|null}
  | {ok:false; code:string};

const activitySet:ReadonlySet<string>=new Set(ADMIN_ACTIVITIES);
const packageSet:ReadonlySet<string>=new Set(ADMIN_PACKAGES);
const everyId:ReadonlySet<string>=new Set(RESERVATION_IDS);

export function validateAdminExperienceSelection(input:{
  activities:unknown;
  package:unknown;
  choice:unknown;
  date:unknown;
  time:unknown;
  adults:unknown;
  children:unknown;
}, now:Date=new Date()):SelectionResult{
  const rawActivities=input.activities;
  if(!Array.isArray(rawActivities) || rawActivities.length>ADMIN_ACTIVITIES.length)
    return {ok:false,code:'activities'};
  if(!rawActivities.every(x=>typeof x==='string' && activitySet.has(x)) ||
      new Set(rawActivities).size!==rawActivities.length)
    return {ok:false,code:'activities'};
  const activities=rawActivities as AdminActivity[];
  if(input.package!==null && (typeof input.package!=='string'||!packageSet.has(input.package)))
    return {ok:false,code:'package'};
  const selectedPackage=input.package as AdminPackage|null;
  if(activities.length===0&&!selectedPackage)return {ok:false,code:'empty'};
  if(typeof input.date!=='string'||typeof input.time!=='string'||
     !Number.isInteger(input.adults)||!Number.isInteger(input.children))
    return {ok:false,code:'invalid'};
  const choice=selectedPackage==='glele'?
    (input.choice==='canoe'||input.choice==='pedalo'?input.choice:null):null;
  if(selectedPackage==='glele'&&!choice)return {ok:false,code:'choice'};
  const selections=[...(selectedPackage?[selectedPackage]:[]),...activities] as ReservationId[];
  if(!selections.every(id=>everyId.has(id)))return {ok:false,code:'invalid'};
  const validated=selections.map(experience=>validateReservation({
    experience,date:input.date,time:input.time,
    adults:input.adults,children:input.children,
    ...(experience==='glele' ? {choice} : {})
  },now));
  if(validated.some(r=>!r.ok))return {ok:false,code:'rules'};
  const first=validated[0];
  if(!first.ok)return {ok:false,code:'rules'};
  // A combination must be manually priced, including crossing exactly once.
  // For one selection, the existing quote remains indicative, never confirmed.
  const quoteAmount=selections.length===1?first.quote.total:null;
  return {
    ok:true,
    selection:{activities,package:selectedPackage,choice},
    primary:first.reservation,
    quoteAmount
  };
}
