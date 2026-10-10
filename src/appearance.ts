import { bodyBuilds, type State, type BodyBuild } from './model';
import { weightTrend } from './weight';
import { dayKey } from './calendar';
import { rankProgress, ranks, attributeProgress, type Attribute } from './domain';
// Only presentation thresholds: they never change earned XP, ranks, or rewards.
export const appearanceRules = {
  honorificRankIndex: 2,
  presenceGroomingLevel: 3,
  bodyMiddleProgress: 0.5,
  bodyTargetProgress: 1,
  wisdomBeardLevels: [3, 6] as const,
  strengthFullnessLevel: 10,
  vitalityComplexionLevel: 10,
  maximumBuildScale: 1.08,
  maximumFaceBrightness: 1.06,
  maximumFaceSaturation: 1.08,
};
export function knightAppearance(renown = 0, xp: Partial<Record<Attribute, number>> = {}, weight?: State['weight'], today = dayKey(), portrait: State['portrait'] = 'classic') {
  const rank = rankProgress(renown).rank;
  const stage = ranks.indexOf(rank);
  const level = (attribute: Attribute) => attributeProgress(xp[attribute] || 0).level;
  const body = bodyAppearance(weight, today);
  const groomed = level('Presence') >= appearanceRules.presenceGroomingLevel;
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
  const beards = portrait === 'tied-hair' ? ['short brown stubble', 'fuller brown beard', 'long brown beard'] :
    portrait === 'personal' ? ['short brown beard', 'fuller brown beard', 'long brown beard'] :
    ['clean-shaven', 'short brown beard', 'full brown beard'];
  return {stage, rank: rank.name, beard, strength, vitality, groomed, body: body.build, bodyProgress: body.progress, bodyLinked: body.linked,
    buildScale: 1 + strength * (appearanceRules.maximumBuildScale - 1),
    faceBrightness: 1 + vitality * (appearanceRules.maximumFaceBrightness - 1),
    faceSaturation: 1 + vitality * (appearanceRules.maximumFaceSaturation - 1),
    description: descriptions[stage] + ' · ' + beards[beard] + (portrait === 'tied-hair' ? ' · tied-back brown hair' : '') + (strength > 0 ? ' · broader build' : '') + (vitality > 0 ? ' · rested complexion' : '') + (body.linked ? ` · ${body.build} build` : '') + (groomed ? ' · well-kept' : ' · untidy hair and clothing'),
    message: stage === 0 ? 'Every knight begins by learning the weight of a promise.' : 'Your service is written in what you carry.'};
}

// A retained cosmetic stage derived from genuine trend observations. It creates no reward,
// achievement or stored progression record. Editing source data recomputes it honestly.
export function bodyAppearance(weight?: State['weight'], today = dayKey()): {
  build: BodyBuild; progress: number | null; linked: boolean; hasTrend: boolean;
} {
  const plan = weight?.settings.appearance;
  if (!weight || !plan?.enabled) return {build: 'lean', progress: null, linked: false, hasTrend: false};
  const {baseline, targetGrams} = weight.settings;
  if (!baseline || targetGrams === null || baseline.grams === targetGrams)
    return {build: plan.startingBuild, progress: null, linked: true, hasTrend: false};
  const trends = weightTrend(weight.measurements.filter(m => m.date >= baseline.date && m.date <= today));
  if (!trends.length) return {build: plan.startingBuild, progress: null, linked: true, hasTrend: false};
  const span = targetGrams - baseline.grams;
  // Fluctuations do not take back a reached visual stage. No measurements are fabricated.
  const progress = trends.reduce((best, point) => Math.max(best, Math.max(0, Math.min(1, (point.meanGrams - baseline.grams) / span))), 0);
  const start = bodyBuilds.indexOf(plan.startingBuild), target = bodyBuilds.indexOf(plan.targetBuild);
  const index = progress >= appearanceRules.bodyTargetProgress ? target :
    Math.abs(target - start) === 2 && progress >= appearanceRules.bodyMiddleProgress ? 1 : start;
  return {build: bodyBuilds[index], progress, linked: true, hasTrend: true};
}

export function bodyAppearanceExplanation(weight: State['weight'], today = dayKey()): string | null {
  if (!weight.settings.appearance?.enabled) return null;
  const {baseline, targetGrams} = weight.settings;
  if (!baseline || targetGrams === null)
    return 'Starting build shown. Set a starting weight and target in Chronicle to link future build changes.';
  if (baseline.grams === targetGrams)
    return 'Starting weight and target are equal, so the selected starting build stays in place.';
  if (!bodyAppearance(weight, today).hasTrend)
    return 'Starting build shown. Appearance waits for a seven-day trend with at least three dated measurements on or after your starting date; one weigh-in does not change it.';
  return 'Build follows your recorded weight trend, changing at visual stages rather than with each weigh-in. Your desired build appears when the trend reaches the target; reached stages remain through fluctuations.';
}

// Display-only honour: a player's saved personal name is never rewritten.
export function knightlyName(name: string, renown: number) {
  const stage = ranks.indexOf(rankProgress(renown).rank);
  return stage >= appearanceRules.honorificRankIndex && !/^sir\b/i.test(name.trimStart())
    ? `Sir ${name}` : name;
}
