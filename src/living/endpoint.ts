export const openAiEndpoint = 'https://api.openai.com/v1/chat/completions';
export function validEndpoint(endpoint:string) {
 try {const u=new URL(endpoint);return !u.username&&!u.password&&!u.hash&&!u.search&&(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname));}catch{return false;}
}
export function endpointIdentity(endpoint:string):string|null {
 return validEndpoint(endpoint)?new URL(endpoint).href:null;
}
