/** Compatibility for archived records only. No resident feature remains active. */
export const retiredHouseholdKinds = new Set(['keep','retinue','relic','song']);
export const retiredPeople:Record<string,{name:string;role:string}>={
 arms:{name:'Ser Oswin',role:'a veteran'},scout:{name:'Ysabel Fen',role:'a road warden'},scholar:{name:'Brother Aldren',role:'a travelling scholar'},physician:{name:'Mistress Elin',role:'a physician'},herald:{name:'Edric Vale',role:'a clerk'},captain:{name:'Captain Hester',role:'a watch captain'},bard:{name:'Tomas Reed',role:'a traveller'},
};
const shortRoles:Record<string,string>={Oswin:'a veteran',Ysabel:'a road warden',Aldren:'a travelling scholar',Elin:'a physician',Edric:'a clerk',Hester:'a watch captain',Tomas:'a traveller'};
export function roadText(text:string) {
 let next=text;
 for(const p of Object.values(retiredPeople))next=next.replaceAll(p.name,p.role);
 next=next.replace(/\b(Oswin|Ysabel|Aldren|Elin|Edric|Hester|Tomas)\b/g,name=>shortRoles[name]).replace(/\bthe Keep\b/g,'the old holdfast');
 return next.charAt(0).toUpperCase()+next.slice(1);
}
