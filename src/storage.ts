import type {State} from './domain';
const key='oathbound.knight.v1';
export function load():State|null{const raw=localStorage.getItem(key);if(!raw)return null;const s=JSON.parse(raw);if(s.version!==1||typeof s.name!=='string'||typeof s.created!=='string'||!Array.isArray(s.entries)||!s.oaths||typeof s.oaths!=='object')throw new Error('Saved chronicle cannot be read.');return s;}
export function save(state:State){localStorage.setItem(key,JSON.stringify(state));}
