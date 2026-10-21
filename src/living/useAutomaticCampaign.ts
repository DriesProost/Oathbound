import {useEffect,useRef,useState} from 'react';
import type {State} from '../model';
import {dayKey} from '../calendar';
import {nextAutomaticJob,reserveAutomaticJob,runAutomaticJob,finishAutomaticJob} from './automatic';
import {JsonNarrativeProvider} from './provider';
import {apiCredentials} from './credentials';
import {endpointIdentity,openAiEndpoint} from './endpoint';
export function useAutomaticCampaign(state:State|null,now:Date,access:{current:()=>State|null;fresh:()=>State|null;update:(s:State)=>boolean}) {
 const latest=useRef(access);latest.current=access;
 const mounted=useRef(false),running=useRef(false),controller=useRef<AbortController|null>(null);
 const [pass,setPass]=useState(0);
 useEffect(()=>{
  mounted.current=true;
  const visible=()=>{if(document.visibilityState==='visible')setPass(p=>p+1);else controller.current?.abort();};
  document.addEventListener('visibilitychange',visible);
  return ()=>{mounted.current=false;document.removeEventListener('visibilitychange',visible);controller.current?.abort();};
 },[]);
 useEffect(()=>{
  if(!state||running.current||document.visibilityState!=='visible')return;
  running.current=true;let processed=false;
  const request=new AbortController();controller.current=request;
  const work=async(locked:boolean)=>{
   if(request.signal.aborted)return;
   const current=latest.current.fresh();if(!current)return;
   const date=dayKey(new Date()),job=nextAutomaticJob(current,new Date(),locked);if(!job)return;
   processed=true;
   if(!job.recover&&!latest.current.update(reserveAutomaticJob(current,job,new Date())))return;
   const base=latest.current.current();if(!base)return;
   const cfg=base.living.settings;
   const authenticated=endpointIdentity(cfg.endpoint)!==openAiEndpoint||!!apiCredentials.getKey(cfg.endpoint);
   const provider=cfg.enabled&&authenticated?new JsonNarrativeProvider(cfg):undefined;
   let result:State;
   try{result=await runAutomaticJob(base,job,provider,request.signal);}
   catch{if(request.signal.aborted)return;result=await runAutomaticJob(base,{...job,recover:true});}
   if(request.signal.aborted)return;
   const currentState=latest.current.fresh();if(!currentState)return;
   latest.current.update(finishAutomaticJob(currentState,base,result,job,dayKey(new Date())===date?date:dayKey(new Date())));
  };
  void (async()=>{
   try{
    // Across tabs, only one director works at a time. Re-read the authoritative
    // save under the lock before reserving or accepting any narrative work.
    if(navigator.locks)await navigator.locks.request('oathbound-automatic-campaign',{ifAvailable:true},async lock=>{if(lock)await work(true);});
    else await work(false);
   }catch{/* Read/save errors are handled by the normal persistence surface. */}
   finally{running.current=false;if(controller.current===request)controller.current=null;if(mounted.current&&document.visibilityState==='visible'&&(processed||request.signal.aborted))setPass(p=>p+1);}
  })();
 },[state,now.getTime(),pass]);
}
