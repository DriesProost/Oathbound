import type { Attribute, Reward } from './config';

export const ventureTiers = {
  Brief: { renown: 30, xp: 60, weight: 45 },
  Standard: { renown: 45, xp: 80, weight: 40 },
  Bold: { renown: 65, xp: 100, weight: 15 },
} as const;
export type VentureTier = keyof typeof ventureTiers;
export type VentureDefinition = {
  id: string;
  title: string;
  attribute: Attribute; // Primary attribute used when rotating daily assignments.
  secondaryAttributes?: Attribute[];
  tier: VentureTier;
  duration: string;
  introduction: string;
  instructions: string[];
  steps?: string[];
  reading?: string;
  reflection?: string;
  tags: string[];
  safety?: string;
};
export function ventureAttributes(venture: Pick<VentureDefinition, 'attribute' | 'secondaryAttributes'>): Attribute[] {
  return [venture.attribute, ...(venture.secondaryAttributes ?? [])];
}
export function ventureAttributeLabel(venture: Pick<VentureDefinition, 'attribute' | 'secondaryAttributes'>): string {
  return ventureAttributes(venture).join(' + ');
}
export function ventureReward(tier: VentureTier, attribute: Attribute, secondaryAttributes: readonly Attribute[] = []): Reward {
  const rewarded = [attribute, ...secondaryAttributes];
  if (new Set(rewarded).size !== rewarded.length) throw Error('Venture attributes must be distinct.');
  const totalXP = ventureTiers[tier].xp;
  const share = Math.floor(totalXP / rewarded.length), remainder = totalXP % rewarded.length;
  return {
    renown: ventureTiers[tier].renown,
    xp: Object.fromEntries(rewarded.map((a, index) => [a, share + (index < remainder ? 1 : 0)])),
  };
}
// Authored product content. No service, text generator, or connection is required.
export const ventures: readonly VentureDefinition[] = [
  {
    id: 'foundry-circuit', title: 'The Foundry Circuit', attribute: 'Strength', tier: 'Standard', duration: 'approximately 15–20 min',
    introduction: 'The armourer claims a knight should be useful even when no iron is at hand.',
    instructions: ['Complete three comfortable rounds:'],
    steps: ['10 bodyweight squats', '8 push-ups, incline push-ups if preferred', '10 controlled reverse lunges total', '20-second plank'],
    safety: 'Rest as required. Use comfortable form and adapt movements where necessary.', tags: ['indoor', 'bodyweight'],
  },
  {
    id: 'slow-steel', title: 'Slow Steel', attribute: 'Strength', tier: 'Brief', duration: 'approximately 10 min',
    introduction: 'Today the weapons master asks for control rather than force.',
    instructions: ['Pick one safe bodyweight or resistance exercise.', 'Perform 3 sets of 8 slow repetitions, taking roughly three seconds on the lowering portion of every repetition.'],
    safety: 'No maximal effort required. Use a comfortable effort and adapt the exercise if needed.', tags: ['indoor', 'gym', 'bodyweight'],
  },
  {
    id: 'runners-trial', title: "The Runner's Trial", attribute: 'Endurance', tier: 'Standard', duration: 'approximately 25 min',
    introduction: 'The captain of the watch points toward the eastern road.', instructions: [],
    steps: ['Walk 5 minutes', 'Run gently for 60 seconds', 'Walk 90 seconds', 'Repeat the run/walk interval 6 times', 'Walk 5 minutes to finish'],
    safety: 'The running pace should remain controlled, not a sprint. Use a comfortable effort and adapt the exercise if needed.', tags: ['outdoor'],
  },
  {
    id: 'road-untravelled', title: 'A Road Untravelled', attribute: 'Endurance', tier: 'Bold', duration: 'approximately 45–60 min',
    introduction: 'There are roads near the Keep your boots have never properly known.',
    instructions: ['Take a walk of at least 45 minutes using a route you do not normally choose.', 'No pace requirement.', 'Pay attention to one place, building, path or landscape detail you had never properly noticed before.'],
    safety: 'Choose a safe route and adapt the walk if needed.', tags: ['outdoor', 'nature'],
  },
  {
    id: 'scholar-guilds', title: 'The Scholar at the Gate: Why Guilds Mattered', attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'A travelling scholar asks for a place beside the hearth.',
    reading: 'Medieval guilds were more than associations of people doing the same job. In many European towns they controlled entry into trades, trained apprentices, inspected workmanship and negotiated with local authorities.\n\nA young craftsman might begin as an apprentice living and working under a master. After years of training he could become a journeyman, literally someone entitled to work for a daily wage. Becoming a master often required producing an impressive piece of work demonstrating competence, the origin of the term “masterpiece.”\n\nGuilds could also provide support when members became ill, arrange funerals, maintain chapels and take part in civic ceremonies. In some cities wealthy guilds acquired considerable political power.\n\nThe system protected standards and provided social security, but it could also restrict competition and make it difficult for outsiders to enter a trade.',
    reflection: 'Which part sounds most like a modern professional organisation, and which part sounds least modern?',
    instructions: ['Reading the lesson is sufficient to complete the Venture.'], tags: ['indoor', 'reading'],
  },
  {
    id: 'engineer-castles', title: "The Engineer's Lesson: Why Castles Changed", attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'An old mason unfolds a charcoal drawing of a fortress wall.',
    reading: 'High medieval castles often relied on tall stone walls and towers. Height helped defenders see approaching armies and made direct assault difficult.\n\nGunpowder artillery gradually changed the problem.\n\nCannon could repeatedly strike the same section of a tall vertical wall. Instead of merely climbing over a defence, an attacker could eventually create a breach through it.\n\nFortification therefore evolved. Walls became lower and much thicker. Earth was increasingly used behind masonry because packed soil absorbed cannon impacts better than brittle stone alone. Towers and walls also began to form angled shapes so defenders could fire along neighbouring sections instead of leaving blind spots.\n\nBy the sixteenth century this produced the star-shaped bastioned fortifications associated with the early modern period.\n\nThe interesting lesson is that military technology did not simply make fortifications obsolete. It forced them to evolve.',
    reflection: 'What modern technology can you think of that caused defence to change rather than disappear?', instructions: ['Reading the lesson completes the Venture.'], tags: ['indoor', 'reading'],
  },
  {
    id: 'provisioners-supper', title: "The Provisioner's Supper", attribute: 'Vitality', tier: 'Standard', duration: 'approximately 20–40 min',
    introduction: 'The quartermaster refuses to let the garrison live entirely on ale and hard bread.', instructions: ['Prepare a meal containing:', 'No calorie target is required.', 'The objective is simply to deliberately prepare a decent meal.'],
    steps: ['a meaningful protein source', 'at least one vegetable or piece of fruit', 'a carbohydrate or other substantial energy source', 'water alongside it'], tags: ['indoor', 'cooking'],
  },
  {
    id: 'sun-and-air', title: 'Sun and Air', attribute: 'Vitality', tier: 'Brief', duration: 'approximately 20 min',
    introduction: 'The physician orders you out of the hall.', instructions: ['Spend at least 20 minutes outside.', 'You may walk, sit, read or simply be outdoors.', 'Do not combine this with a requirement for pace or exercise. The Venture is the deliberate time outside itself.'], tags: ['outdoor'],
  },
  {
    id: 'prepare-for-court', title: 'Prepare for Court', attribute: 'Presence', tier: 'Standard', duration: 'approximately 15–25 min',
    introduction: 'Word arrives that visitors will enter the Great Hall.', instructions: ['Deliberately improve your presentation.', 'Choose several:', 'Then look at the result as a complete presentation rather than a list of chores.'],
    steps: ['groom beard or shave deliberately', 'style hair', 'skincare', 'trim nails', 'choose an outfit rather than grabbing the nearest clothes', 'clean or inspect footwear', 'apply fragrance if you use it'], tags: ['indoor', 'grooming'],
  },
  {
    id: 'wardrobe-muster', title: 'The Wardrobe Muster', attribute: 'Presence', tier: 'Brief', duration: 'approximately 10–15 min',
    introduction: 'The chamberlain eyes your wardrobe with suspicion.', instructions: ['Pick one neglected item of clothing, footwear or accessory.', 'Clean it, repair a minor issue, properly fold/store it, or decide honestly that it should be discarded.', 'Then deliberately prepare one outfit you would be comfortable wearing tomorrow.'], tags: ['indoor'],
  },
  {
    id: 'first-blow', title: 'The First Blow', attribute: 'Resolve', tier: 'Standard', duration: '20 min',
    introduction: 'The hardest part of a siege is often beginning it.', instructions: ['Choose one useful task you have been postponing.', 'Before entertainment, work on it for 20 uninterrupted minutes.', 'You do not have to finish it.', 'The Venture is won by beginning properly.'], tags: ['focus'],
  },
  {
    id: 'one-hour-unclaimed', title: 'One Hour Unclaimed', attribute: 'Resolve', tier: 'Bold', duration: '60 min',
    introduction: 'For one hour, the heralds and hawkers are barred from the Keep.', instructions: ['Spend one continuous hour without:', 'You may use your phone or computer for a deliberate task, navigation, music, reading or communication.', 'Do something chosen rather than merely consumed.'],
    steps: ['short-form video', 'social-media feeds', 'purposeless browsing'], tags: ['focus', 'indoor', 'outdoor'],
  },
  {
    id: 'steady-shield', title: 'The Steady Shield', attribute: 'Strength', tier: 'Brief', duration: 'approximately 10 min',
    introduction: 'The shield master reminds you that a steady centre keeps the whole line standing.',
    instructions: ['Complete two comfortable rounds:', 'Move slowly enough to stay in control. Rest between movements as needed.'],
    steps: ['6 bird-dogs per side, extending an opposite arm and leg from hands and knees', '10 glute bridges, lifting your hips gently from a bent-knee position on your back', '15–20 seconds of a wall plank, with your hands against a wall and feet a comfortable step away'],
    safety: 'Use a comfortable effort. If floor work does not suit you, replace the bird-dogs and bridges with supported standing knee raises and gentle standing hip extensions. Avoid painful movements.', tags: ['indoor', 'bodyweight'],
  },
  {
    id: 'quartermasters-carry', title: "The Quartermaster's Carry", attribute: 'Strength', tier: 'Brief', duration: 'approximately 10 min',
    introduction: 'The quartermaster has little use for strength that cannot carry the provisions home.',
    instructions: ['Choose two light objects with secure handles, such as lightly filled shopping bags.', 'On a clear, level path, carry them for 20–30 seconds while standing tall and walking comfortably.', 'Set them down gently, rest for about a minute, and repeat for four carries.'],
    safety: 'Keep the load light enough to grip easily without straining or holding your breath. Avoid stairs and unstable containers. If carrying does not suit you, practise four short, unloaded walks with relaxed upright posture.', tags: ['indoor', 'outdoor', 'equipment'],
  },
  {
    id: 'apprentices-form', title: "The Apprentice's Form", attribute: 'Strength', tier: 'Standard', duration: 'approximately 15–20 min',
    introduction: 'The weapons master sets aside the heavy iron. Today you are to learn one movement properly.',
    instructions: ['Choose a familiar, safe movement: a squat to a stable chair, a wall push-up, or a light resistance exercise you already know.', 'Warm up with a few easy repetitions. Then perform three sets of six comfortable repetitions, resting as needed.', 'Give each set one focus: a stable starting position, a smooth movement, then steady breathing.', 'Finish with one easy set bringing those three things together.'],
    safety: 'Use a comfortable effort and leave plenty of repetitions in reserve. Use familiar equipment and adapt the movement if needed. Stop if the movement causes pain.', tags: ['indoor', 'gym', 'bodyweight'],
  },
  {
    id: 'oarsmans-practice', title: "The Oarsman's Practice", attribute: 'Strength', tier: 'Standard', duration: 'approximately 15–20 min',
    introduction: 'A river captain claims that a knight ought to know how to pull as well as push.',
    instructions: ['Practise a pulling movement with a light dumbbell or a light, securely held object.', 'For a supported one-arm row, place your free hand on a stable surface, keep your back comfortable, and draw the weight gently toward your side.', 'Perform three sets of eight controlled repetitions on each side. Rest as needed and lower the weight without dropping it.'],
    safety: 'Choose a light load and a position you can hold comfortably. A familiar seated rowing machine at an easy setting is an alternative. If neither option suits you, practise gentle seated shoulder-blade squeezes for three sets of eight instead.', tags: ['indoor', 'gym', 'equipment'],
  },
  {
    id: 'messengers-pace', title: "The Messenger's Pace", attribute: 'Endurance', tier: 'Brief', duration: 'approximately 12 min',
    introduction: 'A message must reach the next watch post, but the messenger has no wish to arrive breathless.',
    instructions: [],
    steps: ['Walk easily for 3 minutes', 'Alternate 1 minute of purposeful walking with 1 minute of easy walking, three times', 'Walk easily for 3 minutes to finish'],
    safety: 'Purposeful walking should still allow you to speak comfortably. Slow down or keep the whole walk easy if needed. Choose a safe route or an indoor walking space.', tags: ['outdoor', 'indoor'],
  },
  {
    id: 'three-watchtowers', title: 'The Three Watchtowers', attribute: 'Endurance', tier: 'Standard', duration: 'approximately 20–30 min',
    introduction: 'The captain asks you to link three watch posts into one small patrol.',
    instructions: ['Choose three nearby, safely accessible landmarks: perhaps a bench, a shopfront and a familiar tree.', 'Plan a walking loop that connects all three and brings you back in roughly 20–30 minutes.', 'Walk the loop at a comfortable, steady effort. At each landmark, briefly notice one detail before carrying on.'],
    safety: 'Choose landmarks that fit your mobility and surroundings. Shorten the loop, take breaks, or use three points along an accessible indoor route if needed. No distance target or tracking is required.', tags: ['outdoor', 'indoor', 'observation'],
  },
  {
    id: 'courtyard-march', title: 'The Courtyard March', attribute: 'Endurance', tier: 'Standard', duration: 'approximately 20 min',
    introduction: 'Rain has closed the road, but the guard can still make a circuit of the courtyard.',
    instructions: ['Find a clear indoor space and begin with 3 minutes of easy walking or gentle marching.', 'For 14 minutes, alternate 1 minute of comfortable marching with 1 minute of easy side steps or walking around the room.', 'Finish with 3 minutes at an easy pace.'],
    safety: 'Keep your feet low and the effort comfortable; there is no jumping requirement. Use support, take breaks, or use gentle seated marching and arm movements if that suits you better. Avoid slippery floors and obstacles.', tags: ['indoor', 'no-equipment'],
  },
  {
    id: 'market-road', title: 'The Market Road', attribute: 'Endurance', tier: 'Bold', duration: 'approximately 45–60 min',
    introduction: 'The steward sends you beyond the gate with a purpose, rather than another lap of the walls.',
    instructions: ['Choose a small errand or destination you can reach on foot: returning a library book, posting a letter, visiting a park, or collecting one light item.', 'Make a comfortable walking outing of roughly 45–60 minutes in total, including the return.', 'Let the destination give the journey a purpose. Buying anything is optional.'],
    safety: 'Choose a safe, accessible route and check opening hours if relevant. Do not carry a heavy load. Adapt the length or take breaks as needed; no pace requirement applies.', tags: ['outdoor', 'errand'],
  },
  {
    id: 'cartographer-flat-world', title: "The Cartographer's Lesson: Why Maps Distort", attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'The royal cartographer spreads two maps across the table. They disagree, yet neither is simply a mistake.',
    reading: `A globe represents the Earth on a curved surface. A flat map must translate that surface onto a plane. Imagine peeling an orange and trying to press its skin flat without tearing, stretching or overlapping it. The difficulty is not poor craftsmanship: the shapes of the two surfaces are different.

A map projection is a rule for making that translation. Every world projection introduces distortion somewhere. It may change areas, angles, distances or directions. The useful question is therefore not whether a map distorts, but which properties it preserves and what job it is meant to do.

The Mercator projection preserves local angles. On it, a course of constant compass bearing appears as a straight line, which made it useful for navigation. But land near the poles appears greatly enlarged. Greenland looks much closer in size to Africa than it really is.

An equal-area projection preserves relative area, helping comparisons of countries or habitats, but changes shapes. A map designed around one region can reduce distortion there while being unsuitable for the whole world.

Maps are tools built for purposes. Before drawing a conclusion from one, ask what its design makes easy to see and what that same design changes.`,
    reflection: 'When might you choose a map that preserves area rather than one that preserves local angles?',
    instructions: ['Reading the lesson is sufficient to complete the Venture.'], tags: ['indoor', 'reading', 'geography'],
  },
  {
    id: 'physician-invisible-road', title: "The Physician's Lesson: The Invisible Road", attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'The physician washes his hands before touching the next patient. The smallest road into the body may be one you cannot see.',
    reading: `In the 1840s, the physician Ignaz Semmelweis worked at a maternity hospital in Vienna. Deaths from childbed fever were much more common in one clinic than another. The difference demanded an explanation, but an explanation alone would not be enough: it needed to guide an action that could be checked.

Doctors and medical students in the higher-mortality clinic also performed autopsies. Semmelweis suspected that material carried on their hands could reach patients during examinations. He introduced hand cleaning with a chlorinated lime solution, and mortality fell sharply.

He did not yet have the modern account of bacteria and infection. Germ theory developed through the work of many researchers. His proposed explanation was incomplete, but the practical change still supplied important evidence that something transferable was involved.

The lesson is broader than a famous instruction to wash your hands. Useful evidence can arrive before a complete theory. At the same time, a change followed by improvement does not automatically prove every detail of an explanation: other conditions and repeated observations still matter.

Today, washing with soap helps remove microbes from hands. That ordinary action rests on a long history of observation, disagreement and better explanations. Something simple to do can take a great deal of work to understand.`,
    reflection: 'Can you think of an action people found useful before they fully understood why it worked?',
    instructions: ['Reading the lesson is sufficient to complete the Venture.'], tags: ['indoor', 'reading', 'science', 'history'],
  },
  {
    id: 'astronomer-borrowed-light', title: "The Astronomer's Lesson: Borrowed Light", attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'The court astronomer points to the Moon. Its changing face is a lesson in where you stand.',
    reading: `The Moon does not shine by making its own visible light. We see sunlight reflected from its surface. Apart from the special case of a lunar eclipse, the Sun illuminates roughly half the Moon at any moment, just as it illuminates the daytime half of the Earth.

As the Moon travels around the Earth, our view of that illuminated half changes. Near new moon, the sunlit side mostly faces away from us. Near full moon, it mostly faces toward us. Between those positions, we see a crescent, a half-lit disc or a gibbous Moon, meaning more than half the visible disc is bright.

The usual phases are not caused by the Earth's shadow moving across the Moon. That shadow causes a lunar eclipse when the Sun, Earth and Moon line up closely enough. Because the Moon's orbit is tilted relative to the Earth's path around the Sun, an eclipse does not happen at every full moon.

The Moon can also be visible during the day. Whether we see it depends on its position, the brightness of the sky and our surroundings; it does not belong exclusively to the night.

A familiar sight becomes easier to explain when you separate the object, its source of light and your point of view. The Moon changes its apparent shape without changing its actual shape.`,
    reflection: 'What other familiar thing looks different because your position changes, rather than because the thing itself changes?',
    instructions: ['Reading the lesson is sufficient to complete the Venture. Looking for the Moon afterward is optional.'], tags: ['indoor', 'reading', 'science', 'nature'],
  },
  {
    id: 'chronicler-missing-ships', title: "The Chronicler's Lesson: The Missing Ships", attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'A merchant boasts that every captain in his hall returned wealthy. The chronicler asks who is missing from the hall.',
    reading: `Imagine a harbour official studying only ships that returned from a difficult voyage. Their captains describe the routes they took, the cargo they carried and the precautions they used. This information is useful, but it leaves out the ships that never returned.

If the official concludes that the surviving ships reveal everything needed for a safe voyage, the conclusion may be badly misleading. A feature common among survivors might have helped them, or it might simply have been common among all ships. Without some knowledge of the missing group, those explanations are hard to separate.

This problem is called survivorship bias. The records we can easily inspect are sometimes the records that passed a selection process. The unsuccessful, discarded or invisible cases receive less attention because they are harder to find.

Modern examples include advice from successful businesses, stories about people who became famous after leaving education, and products still working after many years. Their experiences can teach us something, but they do not by themselves tell us how often the same choices failed elsewhere.

You do not have to dismiss every success story. Instead, ask two questions: which cases made it into this account, and which cases would we need to see before trusting its conclusion? The empty places in a record can matter as much as the names written down.`,
    reflection: 'Where do you often hear advice from successful people without hearing from those who tried the same thing unsuccessfully?',
    instructions: ['Reading the lesson is sufficient to complete the Venture.'], tags: ['indoor', 'reading', 'reasoning'],
  },
  {
    id: 'herb-keepers-table', title: "The Herb Keeper's Table", attribute: 'Vitality', tier: 'Brief', duration: 'approximately 10–15 min',
    introduction: 'The herb keeper insists that the same provisions need not taste the same every evening.',
    instructions: ['Choose a familiar food you are preparing today: vegetables, eggs, beans, rice, or another ordinary meal component.', 'Try a seasoning combination you do not normally use, using two familiar edible herbs, spices or flavourings from your kitchen.', 'Taste a small amount, adjust gently, and notice what each addition changes. The aim is to learn one way to make everyday food more appealing.'],
    safety: 'Use food ingredients you know are safe for you and respect allergies. Do not gather unknown wild plants or taste food that needs cooking while it is raw.', tags: ['indoor', 'cooking'],
  },
  {
    id: 'physicians-pause', title: "The Physician's Pause", attribute: 'Vitality', tier: 'Brief', duration: 'approximately 10 min',
    introduction: 'The physician notices that even a quiet day can leave a knight stiff inside the armour.',
    instructions: ['Take a gentle movement break, standing or seated:', 'Repeat the sequence once if comfortable, then spend a minute moving freely in a way that feels useful.'],
    steps: ['5 slow shoulder rolls in each direction', '5 gentle turns of the head to each side, within a comfortable range', '10 easy opening-and-closing movements of the hands', '5 ankle circles in each direction on each side', '2 minutes of easy walking or gentle seated marching'],
    safety: 'These are easy movements, not stretches to force. Keep breathing normally, use support where needed, and skip anything painful or unsuitable.', tags: ['indoor', 'mobility', 'no-equipment'],
  },
  {
    id: 'second-ration', title: 'The Second Ration', attribute: 'Vitality', tier: 'Standard', duration: 'approximately 20–30 min',
    introduction: 'The quartermaster prepares tomorrow\'s ration before tomorrow\'s hurry can interfere.',
    instructions: ['Prepare one convenient meal or substantial snack for tomorrow.', 'Include a protein source, some fruit or vegetables, and something that supplies substantial energy. A filled sandwich with fruit, a bean-and-grain salad, or leftovers packed with vegetables can all serve.', 'Store it safely and put any utensils or container you need alongside your bag or another useful reminder.'],
    safety: 'Keep perishable food refrigerated and use a suitable cool bag if it will travel. Choose ingredients that fit your needs; no calorie target applies.', tags: ['indoor', 'cooking', 'planning'],
  },
  {
    id: 'cooks-new-craft', title: "The Cook's New Craft", attribute: 'Vitality', secondaryAttributes: ['Wisdom'], tier: 'Bold', duration: 'approximately 45–60 min',
    introduction: 'The cook offers you a place at the bench, provided you are willing to learn more than where the plates are kept.',
    instructions: ['Prepare a meal using one cooking technique you rarely practise: roasting vegetables, making a simple soup, simmering lentils, or another suitable method.', 'Choose a manageable dish and a recipe or method you already have available. Gather the ingredients and read the method before beginning.', 'Make the meal, paying attention to one thing you learn about timing, texture or seasoning.', 'No elaborate feast is required. The Venture is learning through preparing food yourself.'],
    safety: 'Use familiar kitchen equipment safely, follow appropriate cooking and storage guidance, and choose ingredients that suit your dietary needs. An accessible, simpler method is welcome.', tags: ['indoor', 'cooking', 'equipment', 'learning'],
  },
  {
    id: 'letter-of-thanks', title: 'A Letter of Thanks', attribute: 'Presence', tier: 'Brief', duration: 'approximately 10 min',
    introduction: 'The herald reminds you that a kind deed should sometimes be answered with more than a silent nod.',
    instructions: ['Choose someone whose help, kindness or effort you appreciate.', 'Write a short message naming one specific thing they did and why it mattered to you.', 'Send it, give them the note, or say it directly when you have a suitable opportunity today. A reply is not required.'],
    safety: 'Choose someone you are comfortable contacting and respect their boundaries. A simple, sincere message is enough.', tags: ['communication', 'social', 'indoor'],
  },
  {
    id: 'heralds-voice', title: "The Herald's Voice", attribute: 'Presence', tier: 'Brief', duration: 'approximately 10 min',
    introduction: 'The herald lends you the hall for a few minutes. Clear words carry farther than hurried ones.',
    instructions: ['Choose something you can explain in about a minute: who you are, a project you care about, or a recommendation you would give a friend.', 'Say it aloud once. Then choose a clearer opening sentence and try again at a comfortable pace.', 'On a third attempt, leave a small pause between the main points and finish with one clear closing sentence.'],
    safety: 'Use your natural voice without forcing volume. Recording yourself is optional; practising aloud is sufficient.', tags: ['indoor', 'communication', 'confidence'],
  },
  {
    id: 'common-table', title: 'At the Common Table', attribute: 'Presence', tier: 'Standard', duration: 'approximately 15–25 min',
    introduction: 'There is room at the common table for a conversation that goes beyond the weather.',
    instructions: ['Make time for a conversation with a willing friend, relative, colleague or neighbour, in person or by a deliberate call.', 'Ask an open question about something they care about, such as what they have been learning or looking forward to.', 'Listen without preparing your next speech. Ask a follow-up about something they actually said, and share something of your own when appropriate.', 'The aim is attention and connection. You do not need to make the conversation impressive.'],
    safety: 'Choose an appropriate moment and respect privacy and a wish not to talk. Adapt the format to the communication that works for you.', tags: ['social', 'communication'],
  },
  {
    id: 'envoys-visit', title: "The Envoy's Visit", attribute: 'Presence', tier: 'Bold', duration: 'approximately 30–60 min',
    introduction: 'The steward asks you to step beyond the familiar hall and see where the neighbouring folk gather.',
    instructions: ['Visit a welcoming public place or local gathering you rarely choose: a library activity, a free exhibition, a community garden open to visitors, or another accessible shared space.', 'Spend roughly half an hour or more taking part, looking around deliberately, or learning what happens there.', 'If it feels appropriate, ask one practical question of a host or participant. Speaking to a stranger is optional; showing up with attention is sufficient.'],
    safety: 'Choose somewhere safe and open to visitors, check accessibility and opening times, and stay within your budget. No purchase or paid event is required.', tags: ['outdoor', 'indoor', 'community', 'culture'],
  },
  {
    id: 'sealed-decision', title: 'The Sealed Decision', attribute: 'Resolve', tier: 'Brief', duration: 'approximately 10–15 min',
    introduction: 'The steward has two acceptable plans and no seal upon either. A small decision can hold a whole day at the gate.',
    instructions: ['Choose one small, low-stakes decision you have been leaving open: which book to begin, when to do an errand, or where to put a useful household item.', 'Write down two workable options and the one consideration that matters most.', 'Choose an option and take its first practical step today. You may revise it later if you learn something new.'],
    safety: 'Use a genuinely low-stakes choice. Health, major financial, legal and other consequential decisions deserve the information and time they need.', tags: ['indoor', 'planning', 'focus'],
  },
  {
    id: 'silenced-bell', title: 'The Silenced Bell', attribute: 'Resolve', tier: 'Brief', duration: 'approximately 10 min',
    introduction: 'Not every bell in the Keep needs to summon you from your work.',
    instructions: ['Choose one application or device that interrupts you with nonessential notifications.', 'Review its notification settings and switch off one category you do not need, such as promotional alerts or activity suggestions.', 'Put the device aside and spend the remaining few minutes on something you deliberately chose.'],
    safety: 'Keep alerts needed for safety, care responsibilities, accessibility or essential communication. Choose a setting you can change back whenever you wish.', tags: ['indoor', 'focus', 'digital'],
  },
  {
    id: 'cleared-gate', title: 'The Cleared Gate', attribute: 'Resolve', tier: 'Standard', duration: 'approximately 20–25 min',
    introduction: 'Before the work can enter the Keep, someone must move the cart blocking the gate.',
    instructions: ['Choose a useful activity you keep avoiding because getting started is awkward.', 'Spend up to 10 minutes removing its immediate obstacles: clear the relevant surface, gather materials, find the document, or put the needed equipment ready.', 'Then spend 10 uninterrupted minutes doing the activity itself.', 'Leave the next step ready to begin. Completing the whole task is not required.'],
    tags: ['indoor', 'focus', 'practical'],
  },
  {
    id: 'unfinished-page', title: 'The Unfinished Page', attribute: 'Resolve', tier: 'Standard', duration: 'approximately 20–30 min',
    introduction: 'The scribe turns to a page that has been waiting far too long for its final line.',
    instructions: ['Choose one small, unfinished piece of practical administration: reply to a straightforward message, file a document, organise the details needed for an appointment, or complete a simple household checklist.', 'Pick something with a clear endpoint that fits roughly 20–30 minutes.', 'Give it your attention until it is finished or you reach a meaningful stopping point that depends on someone else. Put any necessary follow-up in one place.', 'One closed loop is sufficient. You do not need to clear the whole backlog.'],
    tags: ['indoor', 'focus', 'practical', 'planning'],
  },
  {
    id: 'masons-hold', title: "The Mason's Hold", attribute: 'Strength', tier: 'Brief', duration: 'approximately 10 min',
    introduction: 'The mason braces a beam and reminds you that useful strength sometimes holds still.',
    instructions: ['Stand facing a wall and place your palms against it at a comfortable height.', 'Press gently into the wall for 10 seconds, without holding your breath. Relax for 20–30 seconds and repeat five times.', 'Then do two comfortable wall-plank holds of 15–20 seconds, with your feet a small step back and your body in a supported line. Rest between holds.'],
    safety: 'Use light pressure, comfortable joints and a secure wall. Do not push as hard as you can. You may shorten the holds or perform the gentle presses seated if needed.', tags: ['indoor', 'bodyweight'],
  },
  {
    id: 'tower-steps', title: 'The Tower Steps', attribute: 'Strength', secondaryAttributes: ['Endurance'], tier: 'Standard', duration: 'approximately 20 min',
    introduction: 'The tower keeper asks for steady legs, rather than a race to the battlements.',
    instructions: ['Begin with 5 minutes of comfortable walking.', 'Using a low, secure step and a handrail if needed, perform three sets of six easy step-ups per leg. Step down carefully and rest between sets.', 'Finish with another 5 minutes of comfortable walking.'],
    safety: 'Use a stable, nonslip step that feels easy to manage, not a makeshift platform. Replace step-ups with comfortable sit-to-stands from a stable chair or supported knee raises if needed. Keep the effort controlled.', tags: ['indoor', 'outdoor', 'equipment'],
  },
  {
    id: 'three-tools-armoury', title: 'Three Tools of the Armoury', attribute: 'Strength', tier: 'Standard', duration: 'approximately 20–30 min',
    introduction: 'The armourer asks you to become familiar with three tools before demanding more from any of them.',
    instructions: ['At a gym or with familiar resistance equipment, choose one pushing exercise, one pulling exercise and one leg exercise you already know how to use safely.', 'Check the setup and choose an easy resistance for each.', 'Perform two sets of eight comfortable repetitions of each exercise, resting as needed. Notice one setup detail that makes each movement feel controlled.'],
    safety: 'Use familiar equipment or ask qualified staff for help with its setup. Keep several repetitions in reserve. Adapt any movement that does not suit you; no maximal effort or heavy lifting is required.', tags: ['gym', 'equipment'],
  },
  {
    id: 'training-companion', title: 'A Training Companion', attribute: 'Strength', secondaryAttributes: ['Presence'], tier: 'Bold', duration: 'approximately 35–45 min',
    introduction: 'A companion joins you in the practice yard. There is no tournament today, only shared practice.',
    instructions: ['Arrange a short, comfortable strength practice with a willing friend or household member.', 'Together, choose three familiar exercises that suit both of you. You can use different adaptations or light resistances.', 'Warm up gently, perform two or three easy sets of each exercise, and rest as needed.', 'Encourage one another without comparing loads or repetitions. Finish by each naming one thing that felt useful.'],
    safety: 'Keep this cooperative, not competitive. Neither person needs to coach unfamiliar lifts, spot heavy weights or work through pain. Choose safe movements each person already knows.', tags: ['indoor', 'gym', 'bodyweight', 'social'],
  },
  {
    id: 'waterwheel-turns', title: 'The Waterwheel Turns', attribute: 'Endurance', tier: 'Brief', duration: 'approximately 15 min',
    introduction: 'The miller keeps the wheel turning steadily. Not every useful journey needs a sudden burst of speed.',
    instructions: ['Take a comfortable ride on a stationary bicycle or a bicycle on a safe, familiar route.', 'Begin easily for 3 minutes, ride at a comfortable steady effort for 9 minutes, then ease off for 3 minutes.', 'Choose a resistance or route that lets you speak comfortably.'],
    safety: 'Use familiar, suitable equipment and appropriate cycling precautions. If cycling is unavailable or unsuitable, use the same easy–steady–easy pattern for an accessible walk or gentle seated movement.', tags: ['gym', 'outdoor', 'equipment'],
  },
  {
    id: 'gentle-rise', title: 'The Gentle Rise', attribute: 'Endurance', tier: 'Standard', duration: 'approximately 25–30 min',
    introduction: 'The road rises beyond the village. The captain asks you to meet it patiently.',
    instructions: ['Choose a familiar walking route with a gentle incline, or an easy incline setting on a treadmill you know how to use.', 'Walk easily for 5 minutes, then spend roughly 15–20 minutes walking the gently varied terrain at a controlled effort.', 'Finish with 5 easy minutes. Slow down on the incline rather than trying to keep the same speed.'],
    safety: 'Avoid steep, slippery or exposed routes. Use a flat route with occasional slightly more purposeful sections if inclines do not suit you. Take breaks and adapt the length as needed.', tags: ['outdoor', 'gym'],
  },
  {
    id: 'map-in-hand', title: 'A Map in Hand', attribute: 'Endurance', secondaryAttributes: ['Wisdom'], tier: 'Standard', duration: 'approximately 25–35 min',
    introduction: 'The scout lends you a simple route and asks you to know why each turning is there.',
    instructions: ['Plan a safe walking loop with three or four clear turns. Use a familiar local map or sketch the route from places you know.', 'Before leaving, note which landmark or street name will identify each turn.', 'Walk the route at a comfortable pace, checking your position at the turns rather than following directions without looking around.', 'When you return, identify one landmark that helped you orient yourself. No written answer is required.'],
    safety: 'Keep navigation tools available and use them whenever needed. Choose an accessible route; this is not a challenge to get lost, avoid help, or walk without essential equipment.', tags: ['outdoor', 'navigation', 'learning'],
  },
  {
    id: 'listening-patrol', title: 'The Listening Patrol', attribute: 'Endurance', tier: 'Brief', duration: 'approximately 10–15 min',
    introduction: 'The watch asks for a short patrol with your ears as well as your feet.',
    instructions: ['Take a comfortable walk without entertainment audio for roughly 10–15 minutes.', 'As you go, notice three different sounds and where they seem to come from. They might be footsteps, birds, wind, traffic or a distant conversation.', 'Keep moving at an easy, sustainable pace. This is a small attentive outing, not a test of how much you can identify.'],
    safety: 'Choose a safe route and keep any audio or equipment you need for accessibility. Do not become so focused on sounds that you miss traffic or other hazards.', tags: ['outdoor', 'observation'],
  },
  {
    id: 'weaver-crossing-threads', title: "The Weaver's Lesson: Crossing Threads", attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'The weaver holds up a single thread, then a piece of cloth. The difference lies in how the small things meet.',
    reading: `A single thread is flexible and narrow. To make a useful sheet of fabric, a weaver arranges many threads so that they support one another. In a basic woven cloth, one set runs lengthwise and another crosses it.

The lengthwise threads are called the warp. A loom holds them in position under tension. The crossing thread is the weft, which passes over and under selected warp threads. Repeating that pattern produces cloth. In a plain weave, the weft alternates over and under adjacent warp threads, and the next pass reverses the arrangement.

Friction and the repeated interlacing help the threads stay together. Different fibres, thread thicknesses, spacing and weaving patterns change how the finished fabric drapes, wears and feels. A tightly woven cloth behaves differently from an open weave, even if both use the same fibre.

Knitting makes fabric in another way: it links loops of yarn rather than crossing two sets of straight threads. Those loops help explain why many knitted garments stretch more readily than many woven ones. Fibre and construction both matter, so this is a tendency rather than a rule for every garment.

Clothing is a small piece of engineering you carry around. Its properties come not only from the material, but also from the arrangement of its parts.`,
    reflection: 'What other everyday object gets an important property from the way its parts are arranged?',
    instructions: ['Reading the lesson is sufficient to complete the Venture. Examining a piece of your own clothing afterward is optional.'], tags: ['indoor', 'reading', 'craft'],
  },
  {
    id: 'baker-living-dough', title: "The Baker's Lesson: Living Dough", attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'The baker leaves the dough to rest. Nothing seems to be happening, yet the bowl is busy.',
    reading: `In a yeasted bread dough, some of the work is done by living organisms. Baker's yeast is a fungus. As it uses sugars available in the dough, fermentation produces carbon dioxide and alcohol. The carbon dioxide forms bubbles that help the dough expand.

In wheat dough, proteins can form a stretchy gluten network when flour is mixed with water and worked. That network helps trap gas. It is one reason kneading, mixing and resting can change the texture of a loaf. Other kinds of bread use different ingredients and structures; not every loaf depends on gluten or yeast.

Temperature affects fermentation. Within a suitable range, warmer conditions usually make yeast activity faster, while cooler conditions slow it down. More heat is not always better: excessive heat can damage or kill the yeast. A recipe's resting time is therefore a guide that must be understood alongside the conditions.

Sourdough cultures contain communities of yeasts and bacteria. Some bacteria produce acids that contribute to the flavour and behaviour of the dough. A sourdough starter is an ecosystem maintained by repeated feeding and suitable conditions, not simply an old lump of flour.

Baking turns these processes into food. The rising loaf is a meeting of biology, materials and time. Waiting is not the absence of work; sometimes it is how the work happens.`,
    reflection: 'Where else does giving a process enough time matter more than adding more effort?',
    instructions: ['Reading the lesson is sufficient to complete the Venture. Baking is optional.'], tags: ['indoor', 'reading', 'science', 'cooking'],
  },
  {
    id: 'philosopher-fair-hearing', title: "The Philosopher's Lesson: A Fair Hearing", attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'Two advisers argue before the throne. The philosopher asks each to explain the other\'s position first.',
    reading: `An argument is easier to defeat if you replace it with a weaker version. Someone asks for a quieter street, and an opponent replies as though they demanded a city with no traffic at all. The reply may sound forceful, but it has not addressed the original proposal.

This kind of distortion is often called a straw-man argument. It can happen deliberately, but it can also happen when we listen hurriedly, assume motives or remember only the most irritating part of what someone said.

A useful alternative is to restate the other person's position in a form they would recognise as fair. Identify the main claim, the reasons offered for it and the concern it is trying to address. If you can, ask whether your summary is accurate before responding.

Fairness does not require agreement. You can understand a proposal and still reject it because its evidence is weak, its costs are too high or its values conflict with yours. Understanding simply helps you direct your objection at the actual issue.

It is also helpful to distinguish claims about facts from preferences and predictions. “This route is shorter,” “I prefer it,” and “it will save time tomorrow” need different kinds of support.

A good disagreement can clarify what would change each person's mind. Winning against an invented opponent tells you much less.`,
    reflection: 'What would make you feel that someone had understood your view, even if they still disagreed?',
    instructions: ['Reading the lesson is sufficient to complete the Venture.'], tags: ['indoor', 'reading', 'philosophy', 'communication'],
  },
  {
    id: 'naturalist-flower-visitors', title: "The Naturalist's Lesson: Visitors to a Flower", attribute: 'Wisdom', tier: 'Brief', duration: 'approximately 5–10 min',
    introduction: 'The gardener watches a bee visit the orchard. The tree and its visitor are doing different jobs in the same moment.',
    reading: `Flowers are involved in the reproduction of flowering plants. Pollen carries the male reproductive cells. Pollination is the transfer of pollen to a receptive part of a flower. In many plants, successful pollination can lead to fertilisation and the development of seeds, though the details differ between species.

Plants move pollen in several ways. Grasses and many trees rely on wind. Other plants have relationships with animal visitors, including bees, flies, butterflies, moths, beetles and, in some regions, birds or bats. A visitor seeking nectar or pollen may carry pollen between flowers as it moves.

A bee does not need to intend to help a plant. Its own activity can produce a benefit for the flower. Likewise, the plant's nectar is part of a reproductive strategy, not an act of generosity. The relationship can still be useful to both.

Flowers vary in shape, scent, colour and the time they open. These features can affect which visitors reach them. Not every insect on a flower is an effective pollinator, and not every crop relies on insects to produce the part people eat.

A small patch of flowering plants can therefore be more than decoration: it participates in a wider network of organisms. Watching carefully means asking what each participant is doing, rather than assuming they all share the same purpose.`,
    reflection: 'Can you think of another situation where two participants benefit while pursuing different goals?',
    instructions: ['Reading the lesson is sufficient to complete the Venture. Observing flowers later is optional.'], tags: ['indoor', 'reading', 'nature', 'science'],
  },
  {
    id: 'winter-stores', title: 'The Winter Stores', attribute: 'Vitality', tier: 'Brief', duration: 'approximately 10–15 min',
    introduction: 'The steward opens the pantry before ordering more provisions. Useful supplies should not disappear behind newer ones.',
    instructions: ['Inspect one shelf, drawer or small section of your fridge or pantry.', 'Find a food item you have overlooked that is still safe to use. Move it where you will remember it and choose a specific meal or snack in which to use it.', 'If something needs discarding, deal with it appropriately. You only need to inspect this one small area.'],
    safety: 'Follow storage guidance and date labels. Do not taste food to test whether it is safe or use something you suspect is spoiled. Planning with a clearly safe item is sufficient.', tags: ['indoor', 'nutrition', 'practical'],
  },
  {
    id: 'unhurried-table', title: 'The Unhurried Table', attribute: 'Vitality', tier: 'Standard', duration: 'approximately 15–25 min',
    introduction: 'The cook has set a place for you. Today, supper need not be eaten while answering the heralds.',
    instructions: ['Set aside a comfortable place and roughly 15–25 minutes for a meal you were going to eat today.', 'Put entertainment and nonessential work aside. Sit down with the food rather than eating while moving between tasks.', 'Notice the flavour, texture and how comfortable you feel. Eat at a pace that suits you; there is no requirement to finish the plate or change the amount.'],
    safety: 'Keep any tools, company or support you need. Choose food and a mealtime that suit your health and circumstances.', tags: ['indoor', 'nutrition', 'attention'],
  },
  {
    id: 'hearth-evening', title: 'An Evening by the Hearth', attribute: 'Vitality', tier: 'Standard', duration: 'approximately 20–30 min',
    introduction: 'The physician lowers the lamps. A garrison cannot spend every hour on watch.',
    instructions: ['Choose a 20–30 minute period this evening to make a deliberate transition out of the day.', 'Put one necessary item ready for tomorrow, then make your surroundings a little more comfortable: reduce bright light where suitable, tidy your resting place, or put a distracting device out of reach.', 'Spend the remaining time on a quiet activity you find restful, such as gentle stretching, an unhurried wash, or reading something pleasant.', 'Completing this wind-down is sufficient. You do not have to fall asleep at a particular time.'],
    safety: 'Keep lighting and devices needed for safety, accessibility or care responsibilities. Choose what feels restful for you.', tags: ['indoor', 'evening', 'recovery'],
  },
  {
    id: 'healers-satchel', title: "The Healer's Satchel", attribute: 'Vitality', tier: 'Brief', duration: 'approximately 10–15 min',
    introduction: 'The healer checks the satchel before anyone has need of it.',
    instructions: ['Find your basic first-aid supplies and check one small group, such as plasters, sterile dressings or gloves.', 'Look for damaged packaging or expired items and make a short note of anything that needs replacing.', 'Put the usable supplies in a place you can find easily. If you do not have a kit, make a short list of basic supplies to obtain and choose where to keep them.'],
    safety: 'Keep supplies and medicines safely away from children or anyone who could be harmed by them. Use local guidance for disposal. This is preparation, not a requirement to treat an injury or practise medical procedures.', tags: ['indoor', 'practical', 'first-aid'],
  },
  {
    id: 'remembered-name', title: 'The Remembered Name', attribute: 'Presence', tier: 'Brief', duration: 'approximately 10 min',
    introduction: 'The chamberlain remembers people before he remembers their titles.',
    instructions: ['Choose someone you see occasionally whose name or preferred pronunciation you are unsure of.', 'At an appropriate moment, ask politely rather than guessing. Use their preferred name naturally in the conversation.', 'Learn one ordinary detail they are comfortable sharing, such as an interest or how their day is going. No personal information needs to be recorded.'],
    safety: 'Respect privacy, chosen names and a wish not to chat. A brief, friendly exchange is enough; do not turn it into an interrogation.', tags: ['social', 'communication'],
  },
  {
    id: 'polished-invitation', title: 'A Polished Invitation', attribute: 'Presence', secondaryAttributes: ['Resolve'], tier: 'Brief', duration: 'approximately 10–15 min',
    introduction: 'The herald can carry no invitation that has never been written.',
    instructions: ['Invite someone you would enjoy seeing to one simple activity: a walk, a cup of tea, a shared lunch or another manageable plan.', 'Suggest a specific day or a couple of possible times, and make it easy for them to decline or offer an alternative.', 'Send or say the invitation today. Their answer and whether the meeting happens today do not determine completion.'],
    safety: 'Choose someone you are comfortable contacting, respect their boundaries, and suggest something within your budget and energy.', tags: ['social', 'communication', 'planning'],
  },
  {
    id: 'clear-request', title: 'The Clear Request', attribute: 'Presence', tier: 'Standard', duration: 'approximately 15–20 min',
    introduction: 'The steward cannot grant a request hidden behind three apologies and half a story.',
    instructions: ['Choose one reasonable question or request you have been meaning to communicate to an appropriate person.', 'Prepare a short explanation of the context, say clearly what you are asking for, and include a useful timeframe if relevant.', 'Read it once for clarity, then communicate it today in a suitable message or conversation.', 'Leave the other person room to say no, ask questions or suggest a different approach. A favourable reply is not required.'],
    safety: 'Choose an ordinary, appropriate request and avoid sharing private information unnecessarily. You can adapt the communication format to what works for you.', tags: ['communication', 'social', 'confidence'],
  },
  {
    id: 'tailors-eye', title: "The Tailor's Eye", attribute: 'Presence', tier: 'Standard', duration: 'approximately 20–30 min',
    introduction: 'The tailor says that a useful wardrobe is learned by looking, not by continually buying.',
    instructions: ['Using clothes you already own, assemble two combinations for the same ordinary occasion.', 'Try them on or lay them out. Compare comfort, fit, colour and whether the pieces work together.', 'Make one small adjustment to the combination you prefer: change a layer, pair different footwear, or alter how you wear an existing accessory.', 'Put the chosen combination ready for an occasion when you can use it. No photograph or new purchase is needed.'],
    tags: ['indoor', 'presentation', 'clothing'],
  },
  {
    id: 'treasurers-small-account', title: "The Treasurer's Small Account", attribute: 'Resolve', tier: 'Brief', duration: 'approximately 10–15 min',
    introduction: 'The treasurer asks for one small account to be understood before another coin leaves the purse.',
    instructions: ['Review one ordinary recurring expense or subscription using information you already have available.', 'Find its cost, how often you use it, and when it next renews or needs attention.', 'Choose a small next step: keep it deliberately, set a reminder to review it, or note an intended change and its terms.', 'Understanding this one expense and recording your next step is sufficient.'],
    safety: 'Do not make rushed financial decisions or cancel an essential service. This is a small review, not a requirement to spend, invest or change a contract.', tags: ['indoor', 'planning', 'practical'],
  },
  {
    id: 'unwritten-tale', title: 'The Unwritten Tale', attribute: 'Resolve', secondaryAttributes: ['Wisdom'], tier: 'Standard', duration: 'approximately 20–30 min',
    introduction: 'The scribe offers a blank sheet. Today you are to make a small story rather than wait for one.',
    instructions: ['Write a short scene of roughly 200–400 words in which a character wants something and meets a small obstacle.', 'Give yourself about 15–20 minutes to make a first draft without polishing every sentence.', 'Use the remaining time to read it once and improve one detail: a clearer action, a more specific description, or an ending that follows from what happened.', 'A rough scene is sufficient. You do not have to show it to anyone.'],
    tags: ['indoor', 'writing', 'creative', 'focus'],
  },
  {
    id: 'gatekeepers-boundary', title: "The Gatekeeper's Boundary", attribute: 'Resolve', secondaryAttributes: ['Presence'], tier: 'Standard', duration: 'approximately 15–20 min',
    introduction: 'A well-kept gate opens for a reason. It need not open for every passing demand.',
    instructions: ['Choose one optional request or commitment that does not fit your available time or energy.', 'Prepare a brief, respectful response that explains what you can offer or clearly declines.', 'Communicate it in a suitable way today. You do not need to provide a long defence or win an argument.', 'Choose an ordinary situation you can address safely. The Venture is practising a clear, considered boundary.'],
    safety: 'Do not use this to neglect essential responsibilities or enter an unsafe confrontation. Choose a low-stakes situation and a communication method that suits your circumstances.', tags: ['communication', 'focus', 'social'],
  },
  {
    id: 'work-own-hands', title: 'The Work of Your Own Hands', attribute: 'Resolve', secondaryAttributes: ['Wisdom'], tier: 'Bold', duration: 'approximately 45–60 min',
    introduction: 'The craft master clears a corner of the bench. Something of your own is to exist there before the day is done.',
    instructions: ['Choose a small creative project using materials or tools you already have: a drawing, a simple handmade object, a short piece of music, or another manageable creation.', 'Pick one technique or detail you would like to practise or learn through trying.', 'Spend roughly 45–60 minutes making it, with attention on the work rather than entertainment feeds.', 'Finish with a small result you can look at, hear or use. An imperfect first attempt is sufficient, and sharing it is optional.'],
    safety: 'Use tools and materials you know how to handle safely. Choose a simpler or accessible method if needed; no specialised equipment or purchase is required.', tags: ['indoor', 'creative', 'craft', 'focus', 'learning'],
  },
];
