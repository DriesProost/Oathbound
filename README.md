# Oathbound

A mobile-first self-improvement app. Real-world actions train a grounded medieval knight; setbacks never delete earned progress.

## Development

Node.js 22+ and npm are required.

```sh
npm ci
npm run dev
```

Run `npm test` for progression and sobriety domain tests. Run `npm run build` for TypeScript checking and the production build.

## Structure

- `src/domain.ts`: pure rules for daily quests, rewards, attributes, ranks, walking distance and sobriety history.
- `src/storage.ts`: versioned browser-local persistence, separate from domain rules.
- `src/App.tsx`: onboarding, Keep, Quest Board, Journey, Knight and Chronicle.
- `src/style.css`: responsive interface with restrained medieval illustration and styling.

No account or backend is required. Progress is stored in this browser only; clearing site data removes it. Actions and distance are self-reported. Quest completion awards are final; recording an alcohol setback corrects that day's sobriety status without removing previously earned rewards. Missing days are unknown, not sober. Recent sobriety percentages use only logged days and disclose the denominator.

This first slice has fixed quests and a basic knight illustration. Custom quests, equipment editing, weight logging, detailed steps, authentication, wearable integrations and keep upgrades are future work. Domain attributes can later drive keep upgrades without changing quest presentation. Remote fonts are optional; system and Georgia fallbacks work offline.
