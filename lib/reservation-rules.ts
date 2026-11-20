/**
 * Public enquiry validation and indicative pricing.
 * No inventory or payment confirmation occurs here.
 * All calendar checks use Aquamazone's local time in Benin (Africa/Porto-Novo).
 */
export const RESERVATION_SLOTS = ['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'] as const;
export const RESERVATION_IDS = ['pedalo','canoe','paddle','waterball','pedalboat','lake','mangrove','glele','guezo','toffa','behanzin'] as const;

export type ReservationId = (typeof RESERVATION_IDS)[number];
export type ReservationChoice = 'canoe' | 'pedalo' | 'paddle';
export type ReservationRequest = {
  experience: ReservationId;
  date: string;
  time: string;
  adults: number;
  children: number;
  choice?: ReservationChoice;
  choices?: ReservationChoice[];
};
export type ReservationQuote = {
  total: number | null;
  currency: 'XOF';
  crossingIncluded: boolean;
  crossingAmount: number | null;
  status: 'estimate' | 'confirm_with_team';
  bookingConfirmed: false;
  paymentCollected: false;
  availabilityChecked: false;
};

function beninToday(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Porto-Novo',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const get = (key: string) => parts.find(p=>p.type===key)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function nextBookableDay(now: Date = new Date()): string {
  const today = beninToday(now);
  const midnight = new Date(today + 'T00:00:00Z');
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  return midnight.toISOString().slice(0,10);
}
function isValidCalendarDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + 'T00:00:00Z');
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0,10) === date;
}
export function isNormalOpeningDay(date: string): boolean {
  if (!isValidCalendarDate(date)) return false;
  const weekday = new Date(date + 'T00:00:00Z').getUTCDay();
  return weekday === 0 || weekday === 6;
}
/**
 * Public online enquiry calendar: only the NEXT weekend, opening each Monday.
 * Benin local time is authoritative, including the no-same-day cutoff at midnight.
 * This is NOT a capacity check or a payment authorization.
 */
export type BookingWindowResult =
  | {ok:true; saturday:string; sunday:string}
  | {ok:false; code:'booking_closed'|'outside_booking_weekend'|'saturday_cutoff'|'sunday_cutoff'; saturday:string; sunday:string};

export function bookingWindow(now:Date=new Date()):{saturday:string;sunday:string;weekday:number;hour:number;minute:number}{
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Africa/Porto-Novo',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(now);
  const value=(key:string)=>parts.find(p=>p.type===key)?.value??'';
  const today=`${value('year')}-${value('month')}-${value('day')}`;
  const local=new Date(today+'T00:00:00Z');
  const weekday=local.getUTCDay();
  // Sunday belongs to a closed booking window. The next booking week begins Monday.
  const untilSaturday=(6-weekday+7)%7;
  local.setUTCDate(local.getUTCDate()+untilSaturday);
  const saturday=local.toISOString().slice(0,10);
  local.setUTCDate(local.getUTCDate()+1);
  return {saturday,sunday:local.toISOString().slice(0,10),weekday,
    hour:Number(value('hour')),minute:Number(value('minute'))};
}
export function checkBookingWindow(date:string,now:Date=new Date()):BookingWindowResult{
  const window=bookingWindow(now);
  const dates={saturday:window.saturday,sunday:window.sunday};
  if(window.weekday===0)
    return {ok:false,code:'booking_closed',...dates};
  if(date!==window.saturday&&date!==window.sunday)
    return {ok:false,code:'outside_booking_weekend',...dates};
  if(date===window.saturday&&window.weekday===6)
    return {ok:false,code:'saturday_cutoff',...dates};
  return {ok:true,...dates};
}

export type ValidationResult =
  | { ok: true; reservation: ReservationRequest; quote: ReservationQuote }
  | { ok: false; code: string; message: string };

function error(code: string, message: string): ValidationResult { return { ok:false, code, message }; }

export function validateReservation(input: unknown, now: Date = new Date(), options: {manualIntake?:boolean} = {}): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return error('invalid_request','Invalid request.');
  const obj = input as Record<string,unknown>;
  if (typeof obj.experience !== 'string' || !(RESERVATION_IDS as readonly string[]).includes(obj.experience))
    return error('unknown_experience','Please choose a listed experience.');
  const experience = obj.experience as ReservationId;
  if (typeof obj.date !== 'string' || !isValidCalendarDate(obj.date))
    return error('invalid_date','Please choose a valid date.');
  if (!isNormalOpeningDay(obj.date))
    return error('special_day','Weekday visits require advance coordination through WhatsApp.');
  const window=checkBookingWindow(obj.date,now);
  if(!options.manualIntake&&!window.ok) return error(window.code,{
    booking_closed:'Online enquiries reopen Monday for the next weekend.',
    outside_booking_weekend:'Please choose a date in the upcoming weekend.',
    saturday_cutoff:'Saturday bookings close at 23:59 on Friday, Benin time.',
    sunday_cutoff:'Sunday bookings close at 23:59 on Saturday, Benin time.'
  }[window.code]);
  if (typeof obj.time !== 'string' || !(RESERVATION_SLOTS as readonly string[]).includes(obj.time))
    return error('invalid_time','Choose a displayed time slot.');
  if (!Number.isInteger(obj.adults) || !Number.isInteger(obj.children) || (obj.adults as number) < 0 || (obj.children as number) < 0)
    return error('invalid_guests','Guest counts must be non-negative whole numbers.');
  const adults = obj.adults as number, children = obj.children as number, count=adults+children;
  if (count < 1 || count > 20)
    return error('guest_limit','Choose between 1 and 20 guests; larger groups require team assistance.');
  if(children>0&&adults<1)
    return error('accompanying_adult','Children under 12 must be accompanied by a responsible adult.');
  if (experience === 'glele' && adults < 1)
    return error('accompanying_adult','GLÈLÈ requires at least one adult. Children under 12 must be accompanied.');
  if (experience === 'guezo' && (adults !== 2 || children !== 0))
    return error('package_guests','GUÉZO requires exactly two adults.');
  if (experience === 'toffa' && (adults !== 2 || children !== 2))
    return error('package_guests','TOFFA requires two adults and two children.');
  if (experience === 'behanzin' && (adults !== 4 || children !== 0))
    return error('package_guests','BÉHANZIN requires exactly four adults.');
  if (experience === 'pedalboat' && (count < 2 || count > 4))
    return error('capacity','Pedal-powered boats accommodate 2–4 people per request.');
  const validGleleChoice=(v:unknown):v is ReservationChoice=>v==='canoe'||v==='pedalo'||v==='paddle';
  let choices:ReservationChoice[]|undefined;
  if(experience==='glele'){
    if(Array.isArray(obj.choices)){
      if(obj.choices.length!==count||!obj.choices.every(validGleleChoice))
        return error('activity_choice','Choose exactly one GLÈLÈ activity for each participant.');
      choices=[...obj.choices];
      // Single-choice storage/legacy admin workflow does not yet represent multiple guests.
      if(obj.choice!==undefined&&obj.choice!==choices[0])
        return error('activity_choice','The primary GLÈLÈ choice must match the first participant.');
    } else if(count===1&&validGleleChoice(obj.choice))choices=[obj.choice];
    else return error('activity_choice','Choose exactly one GLÈLÈ activity for each participant.');
  }
  const choice=choices?.[0];
  const crossingIncluded = ['glele','guezo','toffa','behanzin'].includes(experience);
  const crossingAmount = crossingIncluded ? 0 : 1500*adults + 500*children;
  let total: number | null = null;
  if (experience==='glele') total = adults*5000 + children*3500;
  else if (experience==='guezo') total = 12000;
  else if (experience==='behanzin') total = 36000;
  else if (experience==='toffa') total = 18000;
  else if (experience==='pedalboat') total = count*(count===2?5000:3000) + crossingAmount;
  else if (['pedalo','canoe','paddle','waterball'].includes(experience)) total = count*3000 + crossingAmount;
  else if (experience==='mangrove') total = count*10000+crossingAmount;
  else if (experience==='lake') total = count*5000+crossingAmount;
  // Lake and mangrove experiences use the approved per-person tariffs.
  const reservation: ReservationRequest = {experience,date:obj.date,time:obj.time,adults,children,...(choice?{choice}:{}),...(choices?{choices}:{})};
  return {ok:true,reservation,quote:{
    total,currency:'XOF',crossingIncluded,crossingAmount,
    status:total===null?'confirm_with_team':'estimate',
    bookingConfirmed:false,paymentCollected:false,availabilityChecked:false
  }};
}


/**
 * Public multi-activity enquiry: one group, one visit, one mandatory crossing.
 * Each selected activity is priced for the entire entered group; individual
 * schedules and equipment allocation remain subject to staff confirmation.
 */
export function validateActivitySelection(
  input:unknown, now:Date=new Date(), options:{manualIntake?:boolean}={}
):ValidationResult{
  if(!input||typeof input!=='object'||Array.isArray(input))
    return error('invalid_request','Invalid activity enquiry.');
  const data=input as Record<string,unknown>;
  const allowed:readonly string[]=['pedalo','canoe','paddle','waterball','pedalboat','lake','mangrove'];
  if(!Array.isArray(data.activities)||data.activities.length===0||
     data.activities.length>allowed.length||
     !data.activities.every(x=>typeof x==='string'&&allowed.includes(x))||
     new Set(data.activities).size!==data.activities.length)
    return error('invalid_activities','Choose at least one unique activity.');
  const activities=data.activities as ReservationId[];
  const results=activities.map(experience=>validateReservation({...data,experience},now,options));
  const failed=results.find(result=>!result.ok);
  if(failed&&!failed.ok)return failed;
  const accepted=results.filter((result):result is Extract<ValidationResult,{ok:true}>=>result.ok);
  const first=accepted[0];
  const adults=data.adults as number,children=data.children as number;
  const crossingAmount=1500*adults+500*children;
  // The pricing function for individual activities already includes crossing.
  // Remove duplicate crossing from each subsequent activity.
  const knownPrices=accepted.every(result=>result.quote.total!==null);
  const total=knownPrices?
    accepted.reduce((sum,result)=>sum+(result.quote.total??0)-crossingAmount,0)+crossingAmount:
    null;
  return {ok:true,reservation:first.reservation,quote:{
    total,currency:'XOF',crossingIncluded:false,crossingAmount,
    status:total===null?'confirm_with_team':'estimate',
    bookingConfirmed:false,paymentCollected:false,availabilityChecked:false
  }};
}
