"""Read alpha bounds for sprite rendering. No artwork pixels are changed.
Run with Python + Pillow, NumPy and SciPy after replacing any sheets; not required for app builds.
"""
from pathlib import Path
from PIL import Image
import json
root = Path(__file__).resolve().parents[1]
bounds = {}
clips = {}

def simplify_boundary(points, tolerance=0.75):
    # Subpixel SVG-path simplification keeps clip metadata small without changing
    # the source image. This is not an artwork resize, warp or filter.
    coordinates = np.asarray(points + [points[0]], dtype=float)
    keep = {0, len(coordinates)-1}; work = [(0, len(coordinates)-1)]
    while work:
        first, last = work.pop()
        if last-first < 2: continue
        delta = coordinates[last]-coordinates[first]
        segment = coordinates[first+1:last]-coordinates[first]
        length = float(delta @ delta)
        distances = np.linalg.norm(segment - np.clip(segment @ delta / length, 0, 1)[:,None] * delta, axis=1) if length else np.linalg.norm(segment, axis=1)
        index = first+1+int(np.argmax(distances))
        if distances[index-first-1] > tolerance:
            keep.add(index); work.extend([(first,index),(index,last)])
    return [points[index] for index in sorted(keep) if index < len(points)]

def silhouette_path(mask, source_x, source_y):
    """Read a component boundary as SVG metadata; never edit image pixels."""
    edges = {}
    def add(a, b):
        edges.setdefault(a, []).append(b)
    padded = np.pad(mask, 1)
    sides = [mask & ~padded[:-2, 1:-1], mask & ~padded[1:-1, 2:],
             mask & ~padded[2:, 1:-1], mask & ~padded[1:-1, :-2]]
    for side, pixels in enumerate(sides):
        for y, x in zip(*np.nonzero(pixels)):
            x, y = int(x) + source_x, int(y) + source_y
            a, b = [((x,y),(x+1,y)), ((x+1,y),(x+1,y+1)),
                    ((x+1,y+1),(x,y+1)), ((x,y+1),(x,y))][side]
            add(a, b)
    paths = []
    while edges:
        start = next(iter(edges)); current = start; points = [start]
        while True:
            following = edges[current].pop()
            if not edges[current]: del edges[current]
            points.append(following); current = following
            if current == start: break
        # Collapse straight boundary runs, retaining all silhouette corners.
        corners = [points[0]]
        for i in range(1, len(points)-1):
            a,b,c = points[i-1:i+2]
            if (b[0]-a[0],b[1]-a[1]) != (c[0]-b[0],c[1]-b[1]): corners.append(b)
        # Internal holes already remain transparent in the original image.
        # Only external component boundaries are needed to isolate neighbours.
        area = sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(corners, corners[1:]+corners[:1]))
        if area <= 0: continue
        paths.append('M' + 'L'.join(f'{x},{y}' for x,y in simplify_boundary(corners)) + 'Z')
    return ''.join(paths)

for path in sorted((root / 'src/assets/knight/sheets').glob('*.webp')):
    with Image.open(path) as image:
        if image.size != (900, 1350):
            raise ValueError(f'Unexpected atlas dimensions: {path.name}')
        # Read six isolated silhouettes across the whole atlas. Equipment can extend
        # beyond an approximate grid boundary; cropping fixed thirds cuts shields.
        import numpy as np
        from scipy.ndimage import label, find_objects, binary_dilation
        alpha = np.asarray(image.getchannel('A'))
        labels, count = label(alpha > 64, structure=np.ones((3, 3)))
        areas = np.bincount(labels.ravel())
        areas[0] = 0
        indices = np.argsort(areas)[-6:]
        if count < 6 or min(areas[i] for i in indices) < 1000:
            raise ValueError(f'Expected six complete isolated figures: {path.name}')
        objects = find_objects(labels)
        boxes = []
        identities = {}
        for index in indices:
            vertical, horizontal = objects[index - 1]
            boxes.append((max(0, horizontal.start - 2), max(0, vertical.start - 2),
                          min(900, horizontal.stop + 2), min(1350, vertical.stop + 2)))
            identities[boxes[-1]] = int(index)
        boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
        boxes = sorted(boxes[:3], key=lambda b: b[0]) + sorted(boxes[3:], key=lambda b: b[0])
        if path.stem.startswith(('personal-', 'tied-hair-')):
            # A carried standard/weapon can be disconnected by transparent air.
            # Group significant components within their atlas cell, preserving
            # that equipment instead of clipping to only the largest body blob.
            groups = [[identities[box]] for box in boxes]
            primary = {index for group in groups for index in group}
            for index in range(1, count+1):
                if index in primary or areas[index] < 64: continue
                vertical, horizontal = objects[index-1]
                column = min(2, int(((horizontal.start+horizontal.stop)/2) / 300))
                row = min(1, int(((vertical.start+vertical.stop)/2) / 675))
                groups[row*3+column].append(index)
            grouped_boxes = []; grouped_masks = []
            for group in groups:
                component = np.isin(labels, group)
                ys, xs = np.nonzero(component)
                grouped_boxes.append((max(0, int(xs.min())-2), max(0, int(ys.min())-2),
                                      min(900, int(xs.max())+3), min(1350, int(ys.max())+3)))
                grouped_masks.append(component)
            boxes = grouped_boxes
        for i, (left, top, right, bottom) in enumerate(boxes):
            for other in boxes[i+1:]:
                if min(right, other[2]) > max(left, other[0]) and min(bottom, other[3]) > max(top, other[1]):
                    if not path.stem.startswith(('personal-', 'tied-hair-')):
                        raise ValueError(f'Overlapping sprite viewports: {path.name}; artwork needs more spacing')
        if path.stem.startswith(('personal-', 'tied-hair-')):
            # Equipment can interleave bounding rectangles without touching.
            # A component clip prevents neighbours leaking into the portrait.
            clips[path.stem] = [silhouette_path(binary_dilation(
                grouped_masks[i][top:bottom, left:right],
                structure=np.ones((3,3))), left, top) for i,(left,top,right,bottom) in enumerate(boxes)]
        regions = []
        for left, top, right, bottom in boxes:
            # Anchor the torso rather than the turned head or combined equipment
            # silhouette. Read pixels only; no source artwork is modified.
            # Banneret's standard rises above the helmet, so its head is below
            # the top edge and to the right of the pole. Other ranks have no flag.
            if path.stem.startswith('knight-banneret'):
                anchor_left = left + round((right - left) * 0.40)
                anchor = alpha[top + round((bottom - top) * 0.10):top + round((bottom - top) * 0.22),
                             anchor_left:left + round((right - left) * 0.85)]
            else:
                anchor_left = left
                anchor = alpha[top + round((bottom - top) * 0.24):top + round((bottom - top) * 0.36), left:right]
            _, anchor_x = np.nonzero(anchor > 128)
            if not len(anchor_x):
                raise ValueError(f'Missing portrait anchor: {path.name}')
            center = round(anchor_left + float(np.median(anchor_x)), 2)
            regions.append([left, top, right - left, bottom - top, center])
        bounds[path.stem] = regions
output = '// Generated sprite viewport metadata. Source artwork is unchanged.\n'
output += 'export const characterBounds: Record<string, number[][]> = {\n'
for key, regions in bounds.items():
    output += '  ' + json.dumps(key) + ': [\n'
    output += ''.join('    ' + json.dumps(region) + ',\n' for region in regions)
    output += '  ],\n'
output += '};\n'
(root / 'src/characterBounds.ts').write_text(output)
clip_output = '// Generated silhouette clip metadata; original artwork pixels are unchanged.\n'
clip_output += 'export const characterClips: Record<string, string[]> = ' + json.dumps(clips, indent=2) + ';\n'
(root / 'src/characterClips.ts').write_text(clip_output)
