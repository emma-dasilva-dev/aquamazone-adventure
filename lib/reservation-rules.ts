/**
 * Public enquiry validation and indicative pricing.
 * No inventory or payment confirmation occurs here.
 * All calendar checks use Aquamazone's local time in Benin (Africa/Porto-Novo).
 */
export const RESERVATION_SLOTS = ['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'] as const;
export const RESERVATION_IDS = ['pedalo','canoe','paddle','waterball','pedalboat','lake','mangrove','glele','guezo','toffa','behanzin'] as const;

export type ReservationId = (typeof RESERVATION_IDS)[number];
export type ReservationChoice = 'canoe' | 'pedalo';
export type ReservationRequest = {
  experience: ReservationId;
  date: string;
  time: string;
  adults: number;
  children: number;
  choice?: ReservationChoice;
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
 * Benin local time is authoritative, including the 22:00 cutoffs.
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
  if(window.weekday===0||(window.weekday===6&&window.hour>=22))
    return {ok:false,code:'booking_closed',...dates};
  if(date!==window.saturday&&date!==window.sunday)
    return {ok:false,code:'outside_booking_weekend',...dates};
  if(date===window.saturday&&(window.weekday===6||window.weekday===5&&window.hour>=22))
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
    saturday_cutoff:'Saturday bookings close Friday at 22:00, Benin time.',
    sunday_cutoff:'Sunday bookings close Saturday at 22:00, Benin time.'
  }[window.code]);
  if (typeof obj.time !== 'string' || !(RESERVATION_SLOTS as readonly string[]).includes(obj.time))
    return error('invalid_time','Choose a displayed time slot.');
  if (!Number.isInteger(obj.adults) || !Number.isInteger(obj.children) || (obj.adults as number) < 0 || (obj.children as number) < 0)
    return error('invalid_guests','Guest counts must be non-negative whole numbers.');
  const adults = obj.adults as number, children = obj.children as number, count=adults+children;
  if (count < 1 || count > 20)
    return error('guest_limit','Choose between 1 and 20 guests; larger groups require team assistance.');
  if (experience === 'glele' && count !== 1)
    return error('package_guests','GLÈLÈ is for exactly one person.');
  if (experience === 'guezo' && (adults !== 2 || children !== 0))
    return error('package_guests','GUÉZO requires exactly two adults.');
  if (experience === 'toffa' && (adults !== 2 || children !== 2))
    return error('package_guests','TOFFA requires two adults and two children.');
  if (experience === 'behanzin' && (adults !== 4 || children !== 0))
    return error('package_guests','BÉHANZIN requires exactly four adults.');
  if (experience === 'pedalboat' && (count < 2 || count > 4))
    return error('capacity','Pedal-powered boats accommodate 2–4 people per request.');
  if (experience === 'glele' && obj.choice !== 'canoe' && obj.choice !== 'pedalo')
    return error('activity_choice','Choose one GLÈLÈ activity.');
  const choice: ReservationChoice | undefined = experience==='glele' ? obj.choice as ReservationChoice : undefined;
  const crossingIncluded = ['glele','guezo','toffa','behanzin'].includes(experience);
  const crossingAmount = crossingIncluded ? 0 : 1500*adults + 500*children;
  let total: number | null = null;
  if (experience==='glele') total = adults*5000 + children*3500;
  else if (experience==='guezo') total = 12000;
  else if (experience==='behanzin') total = 36000;
  else if (experience==='pedalboat') total = count*(count===2?5000:3000) + crossingAmount;
  else if (['pedalo','canoe','paddle','waterball'].includes(experience)) total = count*3000 + crossingAmount;
  // TOFFA, lake outing and mangrove excursion have no publicly approved quotation.
  const reservation: ReservationRequest = {experience,date:obj.date,time:obj.time,adults,children,...(choice?{choice}:{})};
  return {ok:true,reservation,quote:{
    total,currency:'XOF',crossingIncluded,crossingAmount,
    status:total===null?'confirm_with_team':'estimate',
    bookingConfirmed:false,paymentCollected:false,availabilityChecked:false
  }};
}
