import {checkBookingWindow, RESERVATION_SLOTS} from './reservation-rules.ts';

export const ACTIVITIES = ['pedalo','canoe','paddle','waterball','pedalboat','lake'] as const;
export type ActivityId = typeof ACTIVITIES[number];
export type PackageId = 'glele'|'guezo'|'toffa'|'behanzin';
export type Party = {adults:number;children:number};
export type Line = {id:ActivityId; adults:number;children:number};
export type Plan = Party & {date:string;time:string;mode:'package'|'custom';packageId?:PackageId;lines:Line[];gleleChoices?:('canoe'|'pedalo'|'paddle')[]};
export type PriceItem = {label:string;total:number};
export type PlanQuote = {total:number;packageTotal:number;activityTotal:number;crossing:number;crossingIncluded:boolean;items:PriceItem[];bookingConfirmed:false;paymentCollected:false;availabilityChecked:false};
export type PlanResult = {ok:true;quote:PlanQuote;plan:Plan}|{ok:false;code:string};

export const PACKAGE_PRICE:Record<PackageId,number>={glele:0,guezo:12000,toffa:18000,behanzin:36000};
export const isPackageEligible=(id:PackageId,party:Party)=>id==='guezo'?party.adults===2&&party.children===0:id==='toffa'?party.adults===2&&party.children===2:id==='behanzin'?party.adults===4&&party.children===0:party.adults>=1;
export function activityAmount(line:Line):number|null{
 const n=line.adults+line.children;
 if(n<1)return null;
 if(line.id==='pedalboat')return n>=2&&n<=4?(n===2?10000:n*3000):null;
 if(line.id==='lake')return line.adults*5000+line.children*2500;
 return n*3000;
}
const invalid=(code:string):PlanResult=>({ok:false,code});
export function validatePlan(input:unknown,now:Date=new Date()):PlanResult{
 if(!input||typeof input!=='object'||Array.isArray(input))return invalid('invalid_request');
 const v=input as Record<string,unknown>;
 const adults=v.adults,children=v.children;
 if(!Number.isInteger(adults)||!Number.isInteger(children)||!(typeof adults==='number')||!(typeof children==='number')||adults<1||children<0||adults+children>20)return invalid('invalid_guests');
 const party={adults,children};
 if(typeof v.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.date)||!checkBookingWindow(v.date,now).ok)return invalid('invalid_date');
 if(typeof v.time!=='string'||!(RESERVATION_SLOTS as readonly string[]).includes(v.time))return invalid('invalid_time');
 if(v.mode!=='package'&&v.mode!=='custom')return invalid('invalid_mode');
 const mode=v.mode;
 const packageIds:PackageId[]=['glele','guezo','toffa','behanzin'];
 let packageId:PackageId|undefined;
 let gleleChoices:('canoe'|'pedalo'|'paddle')[]|undefined;
 if(mode==='package'){
  if(typeof v.packageId!=='string'||!packageIds.includes(v.packageId as PackageId))return invalid('invalid_package');
  packageId=v.packageId as PackageId;
  if(!isPackageEligible(packageId,party))return invalid('package_guests');
  if(packageId==='glele'){
   const choices=v.gleleChoices;
   if(!Array.isArray(choices)||choices.length!==adults+children||!choices.every(x=>x==='canoe'||x==='pedalo'||x==='paddle'))return invalid('glele_choices');
   gleleChoices=choices as ('canoe'|'pedalo'|'paddle')[];
  }
 }else if(v.packageId!==undefined)return invalid('invalid_package');
 if(!Array.isArray(v.lines)||v.lines.length>ACTIVITIES.length||(mode==='custom'&&v.lines.length<1))return invalid('invalid_activities');
 const lines:Line[]=[];
 for(const raw of v.lines){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return invalid('invalid_activity');
  const row=raw as Record<string,unknown>;
  if(typeof row.id!=='string'||!(ACTIVITIES as readonly string[]).includes(row.id))return invalid('invalid_activity');
  if(!Number.isInteger(row.adults)||!Number.isInteger(row.children)||typeof row.adults!=='number'||typeof row.children!=='number')return invalid('invalid_participants');
  const line:Line={id:row.id as ActivityId,adults:row.adults,children:row.children};
  if(line.adults<0||line.children<0||line.adults>adults||line.children>children)return invalid('invalid_participants');
  if(lines.some(other=>other.id===line.id)||activityAmount(line)===null)return invalid('invalid_capacity');
  lines.push(line);
 }
 const activityTotal=lines.reduce((sum,line)=>sum+(activityAmount(line)??0),0);
 const packageTotal=packageId?(packageId==='glele'?adults*5000+children*3500:PACKAGE_PRICE[packageId]):0;
 const crossing=packageId?0:adults*1500+children*500;
 const items:PriceItem[]=[
  ...(packageId?[{label:packageId.toUpperCase(),total:packageTotal}]:[]),
  ...lines.map(line=>({label:line.id+' ('+line.adults+' adultes, '+line.children+' enfants)',total:activityAmount(line)??0})),
  {label:packageId?'Traversée incluse':'Traversée aller-retour',total:crossing}
 ];
 return {ok:true,plan:{...party,date:v.date,time:v.time,mode,packageId,lines,gleleChoices},quote:{total:packageTotal+activityTotal+crossing,packageTotal,activityTotal,crossing,crossingIncluded:!!packageId,items,bookingConfirmed:false,paymentCollected:false,availabilityChecked:false}};
}
