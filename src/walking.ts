// Route estimate only, not automatic tracking or a claim of measured distance.
export const walkingRules = {metresPerStep: .75, defaultSteps: 4000};
export const stepsToKm = (steps: number) => steps * walkingRules.metresPerStep / 1000;
export const kmToSteps = (km: number) => Math.round(km * 1000 / walkingRules.metresPerStep);
export const routeSteps = (km: number) => kmToSteps(km).toLocaleString();
