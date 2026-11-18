/**
 * Contact details for public reservation enquiries.
 * Format checks are NOT WhatsApp or email ownership verification.
 */
export type BookingContact={fullName:string;phone:string;email:string};
export type ContactValidation=
  | {ok:true;contact:BookingContact}
  | {ok:false;field:'fullName'|'phone'|'email';code:string};

/** Accept all E.164 country calling codes without assuming any home country. */
export function normalizeBookingPhone(value:unknown):string|null{
  if(typeof value!=='string')return null;
  const raw=value.trim();
  if(raw.length>32)return null;
  const normalized=raw.replace(/[\s().-]/g,'');
  return /^\+[1-9]\d{6,14}$/.test(normalized)?normalized:null;
}
export function normalizeBookingEmail(value:unknown):string|null{
  if(typeof value!=='string')return null;
  const email=value.trim().toLowerCase();
  if(email.length<5||email.length>254||email.includes('..')||email.startsWith('.'))return null;
  const valid=/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
  return valid.test(email)?email:null;
}
export function validateBookingContact(value:unknown):ContactValidation{
  if(!value||typeof value!=='object'||Array.isArray(value))
    return {ok:false,field:'fullName',code:'contact_required'};
  const data=value as Record<string,unknown>;
  const rawName=typeof data.fullName==='string'?data.fullName:'';
  if(/[\x00-\x1F\x7F<>]/.test(rawName))return {ok:false,field:'fullName',code:'invalid_name'};
  const fullName=rawName.trim().replace(/\s+/g,' ');
  if(fullName.length<2||fullName.length>100||/[\x00-\x1F\x7F<>]/.test(fullName))
    return {ok:false,field:'fullName',code:'invalid_name'};
  const phone=normalizeBookingPhone(data.phone);
  if(!phone)return {ok:false,field:'phone',code:'invalid_phone'};
  const email=normalizeBookingEmail(data.email);
  if(!email)return {ok:false,field:'email',code:'invalid_email'};
  return {ok:true,contact:{fullName,phone,email}};
}
