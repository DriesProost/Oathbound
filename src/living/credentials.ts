import {endpointIdentity} from './endpoint';
export const credentialStorageKey='oathbound.ai-credential.v1';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type Credential={endpoint:string;key:string;remembered:boolean};
/** Separate device preference. Never part of a campaign save, export or AI context. */
export function createCredentialVault(store:()=>Store=()=>localStorage) {
 let session:Credential|null=null;
 function read(endpoint:string):Credential|null {
  const identity=endpointIdentity(endpoint);if(!identity)return null;
  if(session?.endpoint===identity)return session;
  try {
   const raw=store().getItem(credentialStorageKey);if(!raw||raw.length>18000)return null;
   const v=JSON.parse(raw);
   if(v?.version===1&&v.endpoint===identity&&typeof v.key==='string'&&v.key.trim().length>0&&v.key.length<=16000)return {endpoint:identity,key:v.key,remembered:true};
  }catch{/* Locked/private browser storage simply has no remembered credential. */}
  return null;
 }
 return {
  getKey:(endpoint:string)=>read(endpoint)?.key??'',
  status:(endpoint:string):'remembered'|'session'|'none'=>{const v=read(endpoint);return v?v.remembered?'remembered':'session':'none';},
  save(endpoint:string,draft:string,remember:boolean) {
   const identity=endpointIdentity(endpoint);if(!identity)throw Error('Invalid endpoint');
   const key=draft.trim()||read(endpoint)?.key;if(!key)return;
   if(key.length>16000)throw Error('Invalid credential');
   // Commit persistent storage before changing memory, so failures are never
   // reported as successful remembered saves. Only one endpoint owns the key.
   if(remember)store().setItem(credentialStorageKey,JSON.stringify({version:1,endpoint:identity,key}));
   else {
    let raw:string|null=null;try{raw=store().getItem(credentialStorageKey);}catch{/* Session-only use remains possible without browser storage. */}
    if(raw)store().removeItem(credentialStorageKey);
   }
   session={endpoint:identity,key,remembered:remember};
  },
  forget(endpoint:string) {
   const identity=endpointIdentity(endpoint);if(!identity)return;
   try {
    let raw:string|null=null;try{raw=store().getItem(credentialStorageKey);}catch(error){if(session?.endpoint===identity&&session.remembered)throw error;return;}
    if(raw){let record;try{record=JSON.parse(raw);}catch{/* An unreadable private record can be removed. */}
     if(!record||record.endpoint===identity)store().removeItem(credentialStorageKey);
    }
   }finally{if(session?.endpoint===identity)session=null;}
  },
 };
}
export const apiCredentials=createCredentialVault();
