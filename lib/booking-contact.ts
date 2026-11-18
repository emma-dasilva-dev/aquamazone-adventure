/**
 * Contact details for public reservation enquiries.
 * Syntax checks are NOT WhatsApp or email ownership verification.
 * Verification must be handled by separate provider-backed OTP challenges.
 */
export type BookingContact={fullName:string;phone:string;email:string};
export type ContactValidation=
  | {ok:true;contact:BookingContact}
  | {ok:false;field:'fullName'|'phone'|'email';code:string};

export function validateBookingContact(value:unknown):ContactValidation{
  if(!value||typeof value!=='object'||Array.isArray(value))
    return {ok:false,field:'fullName',code:'contact_required'};
  const data=value as Record<string,unknown>;
  const fullName=typeof data.fullName==='string'?data.fullName.trim().replace(/\s+/g,' '):'';
  if(fullName.length<2||fullName.length>100||/[\x00-\x1F\x7F<>]/.test(fullName))
    return {ok:false,field:'fullName',code:'invalid_name'};
  const rawPhone=typeof data.phone==='string'?data.phone.trim():'';
  // Global E.164 representation; do not assume all clients have a Benin number.
  const phone=rawPhone.replace(/[\s().-]/g,'');
  if(rawPhone.length>32||!/^\+[1-9]\d{6,14}$/.test(phone))
    return {ok:false,field:'phone',code:'invalid_phone'};
  const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
  if(email.length>254||email.length<5||/\s/.test(email)||
     !/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>.]{2,}$/.test(email))
    return {ok:false,field:'email',code:'invalid_email'};
  return {ok:true,contact:{fullName,phone,email}};
}
