/**
 * Administrator-only manual enquiry selection.
 * Standalone activities and an optional forfait are distinct concepts.
 * A single enquiry has one arrival slot, not a guaranteed schedule for each activity.
 */
import {
  RESERVATION_IDS, RESERVATION_SLOTS, nextBookableDay, isNormalOpeningDay, type ReservationId,
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
  // Admin intake records UNCONFIRMED enquiries, including weekday and same-day
  // requests. Public online bookings remain restricted to future weekends.
  const date=input.date;
  const parsedDate=new Date(date+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
     Number.isNaN(parsedDate.valueOf()) ||
     parsedDate.toISOString().slice(0,10)!==date)return {ok:false,code:'invalid_date'};
  const today=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Africa/Porto-Novo',year:'numeric',month:'2-digit',day:'2-digit'
  }).format(now);
  if(date<today)return {ok:false,code:'past_date'};
  if(!(RESERVATION_SLOTS as readonly string[]).includes(input.time))
    return {ok:false,code:'invalid_time'};

  // Validate participant limits/package rules against a standard future Saturday.
  // This avoids applying the public same-day/weekend cutoff to manual intake.
  let Saturday=new Date(nextBookableDay(now)+'T00:00:00Z');
  while(Saturday.getUTCDay()!==6)Saturday.setUTCDate(Saturday.getUTCDate()+1);
  const validationDate=Saturday.toISOString().slice(0,10);
  const validated=selections.map(experience=>validateReservation({
    experience,date:validationDate,time:input.time,
    adults:input.adults,children:input.children,
    ...(experience==='glele'?{choice}:{})
  },now,{manualIntake:true}));
  const firstError=validated.find(result=>!result.ok);
  if(firstError&&!firstError.ok)return {ok:false,code:firstError.code};
  const first=validated[0];
  if(!first.ok)return {ok:false,code:first.code};
  const primary:ReservationRequest={...first.reservation,date};
  // No automatic quote for weekday/same-day intake or combined experiences.
  // Such requests remain for manual review; crossing is never charged twice.
  const standardDate=date>=nextBookableDay(now)&&isNormalOpeningDay(date);
  const quoteAmount=selections.length===1&&standardDate?first.quote.total:null;
  return {
    ok:true,
    selection:{activities,package:selectedPackage,choice},
    primary,
    quoteAmount
  };
}
