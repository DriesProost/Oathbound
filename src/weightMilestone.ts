import type {State,WeightSettings} from './model';
export function weightGoalKey(settings:WeightSettings) {
 return settings.baseline&&settings.targetGrams!==null&&settings.baseline.grams!==settings.targetGrams ? `${settings.baseline.date}:${settings.baseline.grams}:${settings.targetGrams}` : null;
}
export function weightGoalReached(weight:State['weight'],today:string) {
 const {baseline,targetGrams}=weight.settings;if(!baseline||targetGrams===null||baseline.grams===targetGrams)return false;
 return weight.measurements.some(m=>m.date>=baseline.date&&m.date<=today&&(targetGrams<baseline.grams?m.grams<=targetGrams:m.grams>=targetGrams));
}
export function acknowledgeWeightMilestone(before:State,next:State,today:string) {
 const key=weightGoalKey(next.weight.settings);
 const celebrate=!!key&&weightGoalKey(before.weight.settings)===key&&next.weight.measurements!==before.weight.measurements&&next.weight.settings.acknowledgedGoal!==key&&!weightGoalReached(before.weight,today)&&weightGoalReached(next.weight,today);
 return {celebrate,state:celebrate?{...next,weight:{...next.weight,settings:{...next.weight.settings,acknowledgedGoal:key!}}}:next};
}
