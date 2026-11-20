import {createHmac} from 'node:crypto';
import {neon} from '@neondatabase/serverless';

export const sources=['social','friends','search','nearby','other'] as const;
export type DiscoverySource=typeof sources[number];
export type PublicReview={id:string;name:string;comment:string;source:DiscoverySource;rating:number|null;createdAt:string};
export type ReviewStatus='pending'|'approved'|'rejected';
export type PendingReview=PublicReview & {status:ReviewStatus};

export function reviewsConfigured(){
 return Boolean(process.env.DATABASE_URL_INTAKE && process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length>=32);
}
function client(){
 if(!reviewsConfigured())throw Error('Visitor reviews are not configured');
 const url=process.env.DATABASE_URL_INTAKE!;
 const parsed=new URL(url);
 if(!['postgres:','postgresql:'].includes(parsed.protocol)||parsed.pathname!=='/aquamazone')
  throw Error('Expected Aquamazone dedicated database');
 return neon(url);
}
export function validateReview(input:unknown):{ok:true;name:string;comment:string;source:DiscoverySource;rating:number|null}|{ok:false;code:string}{
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,code:'invalid'};
 const r=input as Record<string,unknown>;
 const name=typeof r.name==='string'?r.name.trim().replace(/\s+/g,' '):'';
 const comment=typeof r.comment==='string'?r.comment.trim().replace(/\s+/g,' '):'';
 const source=r.source;
 if(name.length<2||name.length>60||/[<>\x00-\x1f\x7f]/.test(name))return {ok:false,code:'name'};
 if((comment.length>0&&comment.length<20)||comment.length>1000||/[<>\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(comment))return {ok:false,code:'comment'};
 if(/https?:\/\/|www\.|@\w+\.\w+/i.test(comment))return {ok:false,code:'links'};
 if(typeof source!=='string'||!(sources as readonly string[]).includes(source))return {ok:false,code:'source'};
 if(r.rating!==null&&r.rating!==undefined&&(!Number.isInteger(r.rating)||typeof r.rating!=='number'||r.rating<1||r.rating>5))return {ok:false,code:'rating'};
 if(r.consent!==true)return {ok:false,code:'consent'};
 if(typeof r.website==='string'&&r.website.trim().length>0)return {ok:false,code:'spam'};
 return {ok:true,name,comment,source:source as DiscoverySource,rating:typeof r.rating==='number'?r.rating:null};
}
export function reviewFingerprint(ip:string){
 return createHmac('sha256',process.env.ADMIN_SESSION_SECRET!).update('aquamazone-reviews-v1:'+ip).digest('hex');
}
export async function readApprovedReviews(limit=12):Promise<PublicReview[]>{
 const sql=client();
 const rows=await sql`SELECT id,display_name,comment,discovery_source,rating,created_at
 FROM visitor_reviews WHERE status='approved' ORDER BY approved_at DESC,id DESC LIMIT ${Math.min(Math.max(limit,1),30)}`;
 return rows.map(r=>({id:String(r.id),name:String(r.display_name),comment:String(r.comment),source:String(r.discovery_source) as DiscoverySource,rating:r.rating===null?null:Number(r.rating),createdAt:new Date(String(r.created_at)).toISOString()}));
}
export async function createReview(input:{name:string;comment:string;source:DiscoverySource;rating:number|null},fingerprint:string){
 const sql=client();
 // One submission per hour from the same network fingerprint, enforced atomically in SQL
 // by an advisory transaction lock scoped to the fingerprint.
 const rows=await sql`
 WITH locked AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtextextended(${fingerprint},0)) AS acquired),
 recent AS (
  SELECT EXISTS(SELECT 1 FROM visitor_reviews
   WHERE ip_fingerprint=${fingerprint} AND created_at>now()-interval '1 hour') AS blocked
  FROM locked
 ),
 inserted AS (
  INSERT INTO visitor_reviews (display_name,comment,discovery_source,rating,ip_fingerprint)
  SELECT ${input.name},${input.comment},${input.source},${input.rating},${fingerprint}
  FROM recent WHERE NOT recent.blocked
  RETURNING id
 )
 SELECT EXISTS(SELECT 1 FROM inserted) AS created
 `;
 return rows[0]?.created===true;
}
export async function readModerationQueue():Promise<PendingReview[]>{
 const sql=client();
 const rows=await sql`SELECT id,display_name,comment,discovery_source,rating,created_at,status
 FROM visitor_reviews ORDER BY CASE WHEN status='pending' THEN 0 ELSE 1 END,created_at DESC LIMIT 100`;
 return rows.map(r=>({id:String(r.id),name:String(r.display_name),comment:String(r.comment),source:String(r.discovery_source) as DiscoverySource,rating:r.rating===null?null:Number(r.rating),createdAt:new Date(String(r.created_at)).toISOString(),status:String(r.status) as ReviewStatus}));
}
export async function moderateReview(id:string,status:'approved'|'rejected'){
 const sql=client();
 const rows=await sql`UPDATE visitor_reviews SET status=${status},
 approved_at=CASE WHEN ${status}='approved' THEN now() ELSE NULL END
 WHERE id=${id}::uuid RETURNING id`;
 return rows.length===1;
}
