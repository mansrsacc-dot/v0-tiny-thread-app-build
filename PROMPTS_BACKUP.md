# Replicate Generation Prompts Backup

Saved: 2026-05-20  
Source: `app/api/replicate/route.ts`

---

## Outline / Kontūra (`style === "outline"`)

### Black garment variant (`garmentColor === "black"`)
```
make closest objects (humans,dogs,cars) whichever are most significant to picture to outlined picture with only thick bold white thread on plain black background. not too many lines. remove lines from face keep only outer silhouette of face features. maximum 8 clean bold lines per subject. like a one-line tattoo with thick visible lines. no hoodie no clothing no background objects just the subjects on solid black. no stray lines at all. no horizontal lines. no ground lines. no base lines. no pedestal lines. no lines extending below the subject. no floor or surface lines. the outline must float on the background with nothing underneath it. only draw the actual subject shape nothing else. lines must be thick and clearly visible. the bottom of the subject should end cleanly with no extra lines trailing downward. no rectangular border around the image. no frame. no canvas edge. no bounding box. no box outline. do not draw a rectangle around the composition. no borders. no frames. no boxes. no rectangles. no dividing lines. no baseline. no underline. absolutely no horizontal line across the bottom of the image.
```

### White/other garment variant (default)
```
make closest objects (humans,dogs,cars) whichever are most significant to picture to outlined picture with only thick bold black thread on plain white background. not too many lines. remove lines from face keep only outer silhouette of face features. maximum 8 clean bold lines per subject. like a one-line tattoo with thick visible lines. no hoodie no clothing no background objects just the subjects on solid white. no stray lines at all. no horizontal lines. no ground lines. no base lines. no pedestal lines. no lines extending below the subject. no floor or surface lines. the outline must float on the background with nothing underneath it. only draw the actual subject shape nothing else. lines must be thick and clearly visible. the bottom of the subject should end cleanly with no extra lines trailing downward. no rectangular border around the image. no frame. no canvas edge. no bounding box. no box outline. do not draw a rectangle around the composition. no borders. no frames. no boxes. no rectangles. no dividing lines. no baseline. no underline. absolutely no horizontal line across the bottom of the image.
```

> Updated 2026-05-21: added explicit anti-border instructions to suppress horizontal line artifact.

---

## Standard Logo (`style === "standard"`)

### Active prompt
```
keep the main logo or subject of this image EXACTLY as it is. Do not redraw it. Do not stylize it. Do not simplify it. Do not change colors. Do not change shapes. Do not add or remove details. Preserve every single detail, line, color, gradient, and texture identical to the original. Only isolate the logo from its background by placing it on a solid pure white background. The logo itself must look 100% identical to the original input. Pixel-perfect reproduction of the original logo on white background. Only the main logo, no scenery, no extra objects.
```

### Previous prompt (archived in code comment)
```
convert the main subject of this image into a simple flat color vector graphic. keep ALL original colors exactly as they are including white and black. maximum 8 solid colors, clean hard edges, no gradients, no shading, no texture, no stitching, no thread texture. flat smooth solid colors only, like a clean vector graphic. solid white background. only the main subject.
```

---

## Pet Head (`style === "pet-head"`)
```
extract just the head of the pet from this photo. Keep the exact same facial expression, tongue position, eye shape, and all facial features identical to the original photo. Create a clean smooth digital portrait of just the pet head on solid pure white background (#FFFFFF). Head and face only, no body. Smooth clean colors, no texture, no brush strokes, no grain. Sharp clean edges. Do not change or alter any facial features. Pure white background only, no shadows, no objects, no scenery.
```

---

## Car (`style === "car"`)

Base prompt (shared across all three variants):
```
take the car or vehicle from this photo. Keep the exact same shape, proportions, body lines, wheels, and all details identical to the original photo. Convert into a clean digital illustration with simplified smooth color areas and defined edges. Slightly stylized, not photorealistic. Solid pure white background (#FFFFFF). No texture, no brush strokes, no grain, no noise. Only the vehicle, no background objects, no people, no scenery, no shadows.
```

### Variant A — `licensePlate === undefined || null` (user not asked / legacy orders)
```
[base] + License plate must be clearly visible and fully legible — the number plate text is the most important detail, preserve every character on the number plate exactly as it appears in the original photo.
```

### Variant B — `licensePlate === ""` (user chose Nē / no plate)
```
[base] + No license plate, completely remove license plate, clean car without any number plate visible.
```

### Variant C — `licensePlate === "NL725"` (user chose Jā and typed plate)
```
[base] + License plate clearly visible showing exact text 'NL725', number plate is the most important detail, preserve exact plate characters.
```

> Updated 2026-05-24: split into three variants controlled by `licensePlate` param (undefined/null = legacy preserve, "" = remove plate, string = show specific plate text). Customer sees popup asking Jā/Nē before generation starts.

---

## Fallback (unrecognized style)
```
make closest objects whichever are most significant to picture into an artistic rendering. no background objects.
```

---

## Background Removal Settings (`app/api/remove-bg/route.ts`)

### Settings as of 2026-05-20 (BEFORE bug fix)
- **Model**: `cjwbw/rembg` version `fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003`
- **Parameters**: `{ image: imageUrl }` (model defaults: u2net, no alpha matting)
- **Canvas cleanup** (`removeImageBackground` in `page.tsx`):
  - `standard`: global near-white strip — `minRGB > 245` → alpha=0, `minRGB > 230` → feathered alpha
  - `pet-head` / `car`: after rembg, calls canvas cleanup with mode `"standard"` (same near-white strip)
  - `outline`: strips dark/black pixels per garment color
- **Bug**: rembg + global white-strip both remove interior white elements (e.g. white camera ring inside Instagram logo)

### Settings as of 2026-05-26 (AFTER bug fix)
- **`standard` style**: rembg API call **removed**. Replaced with **edge-connected flood fill** in canvas:
  - BFS from all 4 image edges through pixels with `minRGB > 220`
  - Only exterior (edge-reachable) near-white pixels are made transparent
  - Interior white elements enclosed by colored logo pixels are **preserved** (not reachable from edges)
  - Transparent range: `minRGB > 245` → alpha=0; `220–245` → feathered
- **`pet-head` / `car` styles**: unchanged — still call rembg API, then call `removeImageBackground(source, "standard", color)` exactly as before. Because the rembg result has a transparent border, the flood fill is essentially a no-op and correctly preserves the rembg output.
- **`outline` style**: unchanged — still uses simple pixel-color strip (no rembg, no flood fill)
