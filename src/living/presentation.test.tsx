import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {createKnight} from '../domain';
import {Landscape} from './Atmosphere';
import {campaignArt} from './assets';
import CombatScene from './CombatScene';
import {prepareStory} from './director';
describe('Living Campaign visual accessibility',()=>{
 it('has replaceable art mappings for all visual families and readable offline SVG scenes',()=>{
  expect(campaignArt.journey.watchtower.image).toBeNull();expect(Object.keys(campaignArt.enemies)).toHaveLength(7);expect(campaignArt).not.toHaveProperty('portraits');expect(campaignArt).not.toHaveProperty('rooms');
  for(const location of Object.keys(campaignArt.journey))expect(renderToStaticMarkup(<Landscape location={location} weather="Rain"/>)).toContain('role="img"');
 });
 it('keeps Journey art readable without household portraits or room features',()=>{
  const html=renderToStaticMarkup(<Landscape location="watchtower" label="Northwatch Tower"/>);expect(html).toContain('Northwatch Tower');expect(html).not.toContain('retinue');expect(html).not.toContain('room-vignette');
 });
 it('provides text intents and actions and disables every new decorative animation for reduced motion',()=>{
  const css=readFileSync('src/living/living.css','utf8');expect(css).toContain('@media(prefers-reduced-motion:reduce)');expect(css).toContain('animation:none!important');
  const s=prepareStory(createKnight('R','2026-10-21'),'2026-10-21');s.living.story.beats=[{id:'arc:1:stage:4',arcId:'arc:1',date:s.created,stage:4,progress:0,type:'confrontation',title:'Gate',prose:'A meeting',locationId:'watchtower',canonFactsAdded:[],hooksAdded:[],hooksResolved:[],choices:[],combatSetup:'road-brigand',provenance:{source:'authored',generatedAt:s.created}}];
  expect(renderToStaticMarkup(<CombatScene state={s} date={s.created} beatId="arc:1:stage:4" update={()=>true}/>)).toContain('Find another way');
 });
});
