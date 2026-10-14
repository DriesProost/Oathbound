import type { Attribute } from './config';
import type { State } from './model';
import { meets, type WorldCondition } from './worldConditions';
import { known, remember } from './worldRecords';
import type { WorldMilestone } from './worldModel';
export type Retainer = {
  id: string; name: string; title: string; role: string; attribute?: Attribute; location: string;
  biography: string; personality: string; arrival: WorldCondition; arrivalTitle: string; arrivalText: string;
  dialogue: string[]; reactions: { kind: WorldMilestone['kind']; text: string }[]; ventureIntro?: string;
};
// Attribute growth is always a direct route. Secondary routes have distinct themes
// and pacing; the active-day alternative works with any enabled deed or Venture.
const arrival = (attribute: Attribute, age: number, activity: WorldCondition, activeDays: number): WorldCondition => ({ any: [
  { level: { attribute, min: 3 } },
  { all: [{ ageDays: age }, { any: [activity, { activeDays }] }] },
] });
export const retinue: readonly Retainer[] = [
  { id: 'arms', name: 'Ser Oswin', title: 'Master-at-Arms', role: 'Keeper of the practice yard', attribute: 'Strength', location: 'Training Yard',
    biography: 'A former garrison instructor who prefers a repaired shield to a decorated one. He has taught more beginners than champions.', personality: 'Terse, practical, suspicious of bravado.', arrival: arrival('Strength', 14, { training: 6 }, 10), arrivalTitle: 'A MASTER FINDS A YARD', arrivalText: 'Ser Oswin arrives with a practice blade and asks which fence needs mending first.',
    dialogue: ['A comfortable movement, done properly. Begin there.', 'The rack is repaired. It ought to last longer than the speeches.', 'Leave enough strength to put your tools away.'], reactions: [{ kind: 'keep', text: 'More room to practise. A sound improvement.' }, { kind: 'relic', text: 'That blade remembers practice, not a tournament.' }], ventureIntro: 'Ser Oswin has set a practical exercise beside the yard gate.' },
  { id: 'scout', name: 'Ysabel Fen', title: 'Scout', role: 'Reader of roads and weather', attribute: 'Endurance', location: 'Scout Post',
    biography: 'An experienced road warden who notices loose stones, early rain and who has passed through a gate. Her maps carry useful corrections.', personality: 'Observant, dry humour, more comfortable moving than making speeches.', arrival: arrival('Endurance', 21, { distance: 9 }, 16), arrivalTitle: 'A SCOUT RETURNS FROM THE ROAD', arrivalText: 'Ysabel Fen leaves wet boots by the door and a carefully corrected map on the table.',
    dialogue: ['The shorter road is not always the easier one.', 'There is a bench beyond the bend. Sensible people notice benches.', 'The road is still there. Take the portion that suits today.'], reactions: [{ kind: 'chapter', text: 'A road with people at both ends. Worth knowing.' }, { kind: 'restoration', text: 'The beacon makes a useful landmark after dusk.' }], ventureIntro: 'Ysabel Fen has marked a small expedition on the map.' },
  { id: 'scholar', name: 'Brother Aldren', title: 'Scholar', role: 'Keeper of questions and manuscripts', attribute: 'Wisdom', location: 'Library',
    biography: 'A travelling teacher with an untidy satchel and a careful mind. He believes an ordinary object can contain a very good lesson.', personality: 'Curious, mildly eccentric, happy to explain without examining anyone.', arrival: arrival('Wisdom', 28, { ventures: 4, attribute: 'Wisdom' }, 22), arrivalTitle: 'A SCHOLAR SEEKS LODGING', arrivalText: 'A rain-soaked traveller arrives carrying more parchment than clothing. Brother Aldren asks for a dry shelf.',
    dialogue: ['A useful question does not need an impressive answer.', 'I put the diagram somewhere sensible. That may have been a mistake.', 'Understanding begins when we notice what we assumed.'], reactions: [{ kind: 'keep', text: 'A dry shelf is an excellent argument for staying.' }, { kind: 'chapter', text: 'We ought to preserve the names, not just the distance.' }], ventureIntro: 'Brother Aldren has left a lesson open on the library table.' },
  { id: 'physician', name: 'Mistress Elin', title: 'Physician', role: 'Tending the person behind the armour', attribute: 'Vitality', location: 'Garden',
    biography: 'A practical herbalist and physician who keeps clean cloths and good provisions close at hand. She has little patience for heroic discomfort.', personality: 'Calm, precise, quietly unimpressed by unnecessary suffering.', arrival: arrival('Vitality', 35, { ventures: 5, attribute: 'Vitality' }, 28), arrivalTitle: 'THE PHYSICIAN UNPACKS', arrivalText: 'Mistress Elin sets a jar of herbs beside the kitchen window and asks where the clean water is kept.',
    dialogue: ['Rest is useful. It need not earn its place by being dramatic.', 'A meal, some water, a comfortable place to sit. Start with the ordinary things.', 'Adapt the work to the person. The person need not apologise.'], reactions: [{ kind: 'keep', text: 'The garden has room for herbs and somewhere to sit.' }], ventureIntro: 'Mistress Elin has suggested something practical for your care today.' },
  { id: 'herald', name: 'Edric Vale', title: 'Chamberlain', role: 'Host of the Great Hall', attribute: 'Presence', location: 'Great Hall',
    biography: 'A household steward who knows how to welcome a guest and state a request clearly. His immaculate cuffs conceal a talent for gentle jokes.', personality: 'Polished, exacting, quietly funny.', arrival: arrival('Presence', 42, { relics: 3 }, 34), arrivalTitle: 'A PLACE IS SET IN THE HALL', arrivalText: 'Edric Vale arrives before supper and somehow finds a matching pair of candlesticks.',
    dialogue: ['A clear invitation is kinder than a magnificent hint.', 'An attentive welcome costs less than another tapestry.', 'The chair is repaired. You may now impress visitors by letting them sit.'], reactions: [{ kind: 'title', text: 'A name earned by your conduct. I shall use it properly.' }], ventureIntro: 'Edric Vale has left a small suggestion for life beyond the hall.' },
  { id: 'captain', name: 'Captain Hester', title: 'Castellan', role: 'Steward of the gate and watch', attribute: 'Resolve', location: 'Gatehouse',
    biography: 'An old captain who has kept households working through inconvenient seasons. She values a considered beginning and a reliable place for things.', personality: 'Steady, patient, direct; never confuses a quiet day with disloyalty.', arrival: arrival('Resolve', 49, { keptOaths: 20 }, 40), arrivalTitle: 'THE OLD CAPTAIN TAKES LODGING', arrivalText: 'Captain Hester hangs her cloak beside the gate and brings the watch ledger into the warm.',
    dialogue: ['Begin with what can be done from here.', 'Some days call for less. The earlier work is still yours.', 'Put the next tool ready. Tomorrow can decide the rest.'], reactions: [{ kind: 'restoration', text: 'Another place people can use. That is what a watch is for.' }], ventureIntro: 'Captain Hester has identified one useful undertaking for today.' },
  { id: 'bard', name: 'Tomas Reed', title: 'Bard', role: 'Listener and keeper of songs', location: 'Great Hall',
    biography: 'A travelling musician who collects details others leave out: repaired gutters, names at supper, a letter arriving in the right hands.', personality: 'Warm, perceptive, clever without grand praise.', arrival: { any: [{ rank: 1 }, { all: [{ ageDays: 7 }, { ventures: 3 }] }, { distance: 9 }] }, arrivalTitle: 'A SONG FINDS THE HEARTH', arrivalText: 'Tomas Reed asks for a stool near the hearth. He carries a small instrument and listens before playing.',
    dialogue: ['The interesting part is often what happened after the speech.', 'A song can wait. We have a perfectly good evening without one.', 'I have kept a place in the book for something of your own.'], reactions: [{ kind: 'chapter', text: 'There is an air for those lamps. I shall put its name in the book.' }], ventureIntro: 'Tomas Reed has left room for a small act of making.' },
];
export function reconcileRetinue(state: State, date: string, provenance: WorldMilestone['provenance']): State {
  let next = state;
  for (const member of retinue) if (meets(next, member.arrival, date)) next = remember(next, {
    id: member.id, kind: 'retinue', date, provenance, title: member.arrivalTitle,
    text: `${member.arrivalText} ${member.name}, ${member.title}, has joined the Keep.`, attribute: member.attribute, location: member.location,
  });
  if (known(next, 'retinue', 'bard')) next = remember(next, { id: 'bards-tale', kind: 'song', date, provenance,
    title: 'The Bard’s Tale', text: 'Tomas has given the familiar Keep air a place in the Songbook.', location: 'Great Hall' });
  return next;
}
export function currentRemark(state: State, member: Retainer, date: string): string {
  const value = [...`${date}:${member.id}`].reduce((n, c) => n + c.charCodeAt(0), 0);
  const encounter = state.world.encounters.find(e => e.resolvedDate && e.choices.find(c => c.id === e.choiceId)?.characterId === member.id);
  if (encounter && (encounter.resolvedDate === date || value % 4 === 0)) return encounter.choices.find(c => c.id === encounter.choiceId)!.memory;
  const recent = state.world.milestones.filter(m => member.reactions.some(r => r.kind === m.kind) && (!m.attribute || m.attribute === member.attribute)).at(-1);
  const reaction = member.reactions.find(r => r.kind === recent?.kind);
  if (reaction && (recent?.date === date || value % 5 === 0)) return reaction.text;
  if (member.id === 'bard' && value % 3 === 0) {
    const song = state.world.milestones.findLast(m => m.kind === 'song');
    if (song) return `I have put “${song.title}” in the Songbook. Some airs take time to find their notes.`;
  }
  return member.dialogue[value % member.dialogue.length];
}
export function retinueVentureIntro(state: State, attribute: Attribute, date: string) {
  const member = retinue.find(m => m.attribute === attribute && known(state, 'retinue', m.id));
  return member && Number(date.slice(-2)) % 3 === 0 ? member.ventureIntro : undefined;
}
