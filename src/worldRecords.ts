import type { State } from './model';
import type { WorldMilestone } from './worldModel';
export function remember(state: State, event: WorldMilestone): State {
  if (state.world.milestones.some(m => m.kind === event.kind && m.id === event.id)) return state;
  return { ...state, world: { ...state.world, milestones: [...state.world.milestones, structuredClone(event)] } };
}
export const known = (state: State, kind: WorldMilestone['kind'], id: string) => state.world.milestones.some(m => m.kind === kind && m.id === id);
