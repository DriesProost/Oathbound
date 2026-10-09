"""Read alpha bounds for sprite rendering. No artwork pixels are changed.
Run with Python + Pillow, NumPy and SciPy after replacing any sheets; not required for app builds.
"""
from pathlib import Path
from PIL import Image
import json
root = Path(__file__).resolve().parents[1]
bounds = {}
for path in sorted((root / 'src/assets/knight/sheets').glob('*.webp')):
    with Image.open(path) as image:
        if image.size != (900, 1350):
            raise ValueError(f'Unexpected atlas dimensions: {path.name}')
        # Read six isolated silhouettes across the whole atlas. Equipment can extend
        # beyond an approximate grid boundary; cropping fixed thirds cuts shields.
        import numpy as np
        from scipy.ndimage import label, find_objects
        alpha = np.asarray(image.getchannel('A'))
        labels, count = label(alpha > 64, structure=np.ones((3, 3)))
        areas = np.bincount(labels.ravel())
        areas[0] = 0
        indices = np.argsort(areas)[-6:]
        if count < 6 or min(areas[i] for i in indices) < 1000:
            raise ValueError(f'Expected six complete isolated figures: {path.name}')
        objects = find_objects(labels)
        boxes = []
        for index in indices:
            vertical, horizontal = objects[index - 1]
            boxes.append((max(0, horizontal.start - 2), max(0, vertical.start - 2),
                          min(900, horizontal.stop + 2), min(1350, vertical.stop + 2)))
        boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
        boxes = sorted(boxes[:3], key=lambda b: b[0]) + sorted(boxes[3:], key=lambda b: b[0])
        for i, (left, top, right, bottom) in enumerate(boxes):
            for other in boxes[i+1:]:
                if min(right, other[2]) > max(left, other[0]) and min(bottom, other[3]) > max(top, other[1]):
                    raise ValueError(f'Overlapping sprite viewports: {path.name}; artwork needs more spacing')
        regions = [[left, top, right - left, bottom - top] for left, top, right, bottom in boxes]
        bounds[path.stem] = regions
output = '// Generated sprite viewport metadata. Source artwork is unchanged.\n'
output += 'export const characterBounds: Record<string, number[][]> = {\n'
for key, regions in bounds.items():
    output += '  ' + json.dumps(key) + ': [\n'
    output += ''.join('    ' + json.dumps(region) + ',\n' for region in regions)
    output += '  ],\n'
output += '};\n'
(root / 'src/characterBounds.ts').write_text(output)
