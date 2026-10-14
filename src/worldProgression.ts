import { reconcileEncounters } from './encounters';
import { reconcileChapters } from './chapters';
import { reconcileChronicle } from './illuminatedChronicle';
import { reconcileRelics } from './relics';
import { reconcileKeep } from './keep';
import type { State } from './model';
import { validDay } from './calendar';
import { reconcileRetinue } from './retinue';
import type { WorldMilestone } from './worldModel';
export function synchronizeWorld(state: State, date: string, provenance: WorldMilestone['provenance'] = 'earned'): State {
  if (!validDay(date) || date < state.created) return state;
  let next = reconcileKeep(state, date, provenance);
  next = reconcileRetinue(next, date, provenance);
  next = reconcileRelics(next, date, provenance);
  next = reconcileEncounters(next, date, provenance);
  next = reconcileChapters(next, date, provenance);
  next = reconcileRelics(next, date, provenance);
  return reconcileChronicle(next, date);
}
