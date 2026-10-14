import type { State } from './model';
import { validDay } from './calendar';
import { reconcileRetinue } from './retinue';
import type { WorldMilestone } from './worldModel';
export function synchronizeWorld(state: State, date: string, provenance: WorldMilestone['provenance'] = 'earned'): State {
  if (!validDay(date) || date < state.created) return state;
  return reconcileRetinue(state, date, provenance);
}
