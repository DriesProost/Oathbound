import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import KnightArt from './KnightArt';
import {characterSheet} from './characterSheets';
import {bodyBuilds, portraitIds, type State} from './model';
import {progression} from './config';

describe('character portrait framing', () => {
  it('uses the dedicated larger Squire art without changing other builds or equipment', () => {
    expect(characterSheet(0, 0, 'large').src).toContain('squire-large');
    expect(characterSheet(0, 2, 'large').largeOnly).toBe(true);
    expect(characterSheet(0, 0, 'lean').src).toContain('squire-0');
    expect(characterSheet(0, 1, 'sturdy').src).toContain('squire-1');
    expect(characterSheet(1, 0, 'large').src).toContain('man-at-arms-0');
  });

  it('centers the person and fits their complete equipment for all 270 variants', () => {
    for (const portrait of portraitIds) progression.ranks.forEach((rank, stage) => {
      for (const [beard, wisdom] of [0, 225, 750].entries()) {
        for (const body of bodyBuilds) for (const groomed of [false, true]) {
          const weight: State['weight'] = {
            settings: {displayUnit: 'kg', baseline: null, targetGrams: null,
              appearance: {enabled: true, startingBuild: body, targetBuild: body}},
            measurements: [],
          };
          const sheet = characterSheet(stage, beard, body, portrait);
          if (portrait !== 'classic') {
            expect(sheet.src).toContain(`${portrait}-`);
            expect(sheet.clips?.length).toBe(6);
            expect(sheet.clips?.every(path => path.startsWith('M') && path.endsWith('Z'))).toBe(true);
          }
          const index = Number(groomed) * 3 + (sheet.largeOnly ? beard : bodyBuilds.indexOf(body));
          const [sourceX, sourceY, sourceWidth, sourceHeight, center] = sheet.bounds[index];
          expect(center).toBeGreaterThan(sourceX);
          expect(center).toBeLessThan(sourceX + sourceWidth);
          const markup = renderToStaticMarkup(<KnightArt renown={rank.threshold}
            xp={{Wisdom: wisdom, Presence: groomed ? 225 : 0}} weight={weight} portrait={portrait} />);
          const image = markup.match(/<image[^>]* x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
          expect(image).not.toBeNull();
          const [, imageX, imageY, imageWidth] = image!.map(Number);
          const scale = imageWidth / sheet.width;
          expect(imageX + center * scale).toBeCloseTo(320, 6);
          expect(imageX + sourceX * scale).toBeGreaterThanOrEqual(-0.00001);
          expect(imageX + (sourceX + sourceWidth) * scale).toBeLessThanOrEqual(640.00001);
          expect(imageY + sourceY * scale).toBeGreaterThanOrEqual(-0.00001);
          expect(imageY + (sourceY + sourceHeight) * scale).toBeLessThanOrEqual(960.00001);
        }
      }
    });
  });
});
