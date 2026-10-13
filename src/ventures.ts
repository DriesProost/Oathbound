import type { Attribute, Reward } from './config';

export const ventureTiers = {
  Brief: { renown: 30, xp: 20, weight: 45 },
  Standard: { renown: 45, xp: 30, weight: 40 },
  Bold: { renown: 65, xp: 40, weight: 15 },
} as const;
export type VentureTier = keyof typeof ventureTiers;
export type VentureDefinition = {
  id: string;
  title: string;
  attribute: Attribute;
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
export function ventureReward(tier: VentureTier, attribute: Attribute): Reward {
  return { renown: ventureTiers[tier].renown, xp: { [attribute]: ventureTiers[tier].xp } };
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
];
