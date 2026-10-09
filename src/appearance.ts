import { rankProgress, ranks, attributeProgress, type Attribute } from './domain';
// Presentation only: earned progression selects artwork; these details grant nothing.
export function knightAppearance(renown = 0, xp: Partial<Record<Attribute, number>> = {}) {
  const rank = rankProgress(renown).rank;
  const stage = ranks.indexOf(rank);
  const scholar = attributeProgress(xp.Wisdom || 0).level >= 3;
  const traveller = attributeProgress(xp.Endurance || 0).level >= 3;
  const descriptions = [
    'Wool tunic · leather boots · plain oak shield',
    'Mail shirt · iron cap · oak shield',
    'Steel helm · forest-green surcoat · marked shield',
    'Plate harness · gold-edged heraldry · travelling cloak',
    'Distinguished harness · heraldic banner · gold-edged shield',
  ];
  return {stage, rank: rank.name, scholar, traveller,
    description: descriptions[stage] + (scholar ? ' · scholar’s satchel' : '') + (traveller ? ' · rolled travelling cloak' : ''),
    message: stage === 0 ? 'Every knight begins by learning the weight of a promise.' : 'Your service is written in what you carry.'};
}
