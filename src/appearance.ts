import { rankProgress, ranks, attributeProgress, type Attribute } from './domain';
// Only presentation thresholds: they never change earned XP, ranks, or rewards.
export const appearanceRules = {
  wisdomBeardLevels: [3, 6] as const,
  strengthFullnessLevel: 10,
  vitalityComplexionLevel: 10,
  maximumBuildScale: 1.08,
  maximumFaceBrightness: 1.06,
  maximumFaceSaturation: 1.08,
};
export function knightAppearance(renown = 0, xp: Partial<Record<Attribute, number>> = {}) {
  const rank = rankProgress(renown).rank;
  const stage = ranks.indexOf(rank);
  const level = (attribute: Attribute) => attributeProgress(xp[attribute] || 0).level;
  const wisdom = level('Wisdom');
  const beard = wisdom >= appearanceRules.wisdomBeardLevels[1] ? 2 : wisdom >= appearanceRules.wisdomBeardLevels[0] ? 1 : 0;
  const strength = Math.min(1, (level('Strength') - 1) / (appearanceRules.strengthFullnessLevel - 1));
  const vitality = Math.min(1, (level('Vitality') - 1) / (appearanceRules.vitalityComplexionLevel - 1));
  const descriptions = [
    'Wool tunic · leather boots · plain oak shield',
    'Mail shirt · iron cap · reinforced oak shield',
    'Raised-visor helm · travelling armour · oak heraldry',
    'Plate harness · gold-edged heraldry · cream-lined mantle',
    'Distinguished harness · oak banner · gold-edged shield',
  ];
  return {stage, rank: rank.name, beard, strength, vitality,
    buildScale: 1 + strength * (appearanceRules.maximumBuildScale - 1),
    faceBrightness: 1 + vitality * (appearanceRules.maximumFaceBrightness - 1),
    faceSaturation: 1 + vitality * (appearanceRules.maximumFaceSaturation - 1),
    description: descriptions[stage] + (beard === 2 ? ' · full brown beard' : beard === 1 ? ' · short brown beard' : ' · clean-shaven') + (strength > 0 ? ' · broader build' : '') + (vitality > 0 ? ' · rested complexion' : ''),
    message: stage === 0 ? 'Every knight begins by learning the weight of a promise.' : 'Your service is written in what you carry.'};
}
