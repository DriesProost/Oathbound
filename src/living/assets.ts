import keep from '../assets/journey/keep.webp';
import mill from '../assets/journey/mill.webp';
import inn from '../assets/journey/inn.webp';
import village from '../assets/journey/oakhaven.webp';
export type ArtSlot={image:string|null;fallback:'architecture'|'landscape'|'portrait'|'object'|'figure';credit:string};
const slot=(fallback:ArtSlot['fallback'],image:string|null=null):ArtSlot=>({image,fallback,credit:image?'Existing Oathbound artwork':'Original Oathbound SVG study; final painted art can replace this slot'});
export const campaignArt={
 journey:{keep:slot('architecture',keep),forest:slot('landscape'),fields:slot('landscape'),mill:slot('architecture',mill),inn:slot('architecture',inn),monastery:slot('architecture'),village:slot('architecture',village),watchtower:slot('architecture')},
 rooms:Object.fromEntries(['yard','scout-post','library','garden','hall','gatehouse'].map(id=>[id,Array.from({length:5},()=>slot('architecture'))])),
 portraits:Object.fromEntries(['arms','scout','scholar','physician','herald','captain','bard'].map(id=>[id,slot('portrait')])),
 enemies:Object.fromEntries(['road-brigand','shielded-deserter','poacher','boar','veteran','ambush','tavern-challenger'].map(id=>[id,slot('figure')])),
 relics:slot('object'),arcs:slot('landscape'),weather:{rain:slot('landscape'),fog:slot('landscape')},
};
