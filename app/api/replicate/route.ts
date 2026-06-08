import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT ROLLBACK SWITCH
// Flip this to `true` to instantly revert to the pre-rewrite prompts below.
// New prompts written 2026-06-08 (rewritten for Nano Banana / image-to-image:
// positive natural-language descriptions instead of long negative lists).
// The previous strings are preserved verbatim in LEGACY_PROMPTS for one-line rollback.
const USE_LEGACY_PROMPTS = false;
// ─────────────────────────────────────────────────────────────────────────────

// Active (rewritten) prompts — 2026-06-08
const NEW_PROMPTS = {
  outlineBlack:
    "Redraw the main subject of this photo (the person, dog, or vehicle that is most prominent) as a single clean line-art illustration in thick bold white strokes on a solid pure black background. Use at most 8 confident lines per subject, like a minimalist one-line tattoo. Trace only the outer silhouette and the most essential internal contours; for faces, keep only the outer silhouette and drop fine facial detail. The subject floats freely on the black background with empty space beneath it and ends cleanly at the bottom. Render only the subject itself — no clothing, no scenery, no shadow, no surface or ground, and no border or frame around the image.",
  outlineWhite:
    "Redraw the main subject of this photo (the person, dog, or vehicle that is most prominent) as a single clean line-art illustration in thick bold black strokes on a solid pure white background. Use at most 8 confident lines per subject, like a minimalist one-line tattoo. Trace only the outer silhouette and the most essential internal contours; for faces, keep only the outer silhouette and drop fine facial detail. The subject floats freely on the white background with empty space beneath it and ends cleanly at the bottom. Render only the subject itself — no clothing, no scenery, no shadow, no surface or ground, and no border or frame around the image.",
  standard:
    "Isolate the main logo or subject from this image and place it on a solid pure white background. Reproduce it exactly as in the original — identical colors, shapes, gradients, textures, and every detail, pixel-for-pixel. Do not redraw, stylize, simplify, recolor, or add or remove anything. Keep only the main logo or subject, with no surrounding scenery or extra objects.",
  petHead:
    "Create a clean, smooth digital portrait of just the pet's head from this photo on a solid pure white background (#FFFFFF). Preserve the exact facial expression, tongue position, eye shape, and every facial feature identical to the original — do not alter them. Head and face only, no body. Use smooth clean colors with sharp clean edges and no texture, grain, or brush strokes. White background only, with no shadows, objects, or scenery.",
  carBase:
    "Convert the car or vehicle from this photo into a clean digital illustration on a solid pure white background (#FFFFFF). Keep the exact shape, proportions, body lines, wheels, and all details identical to the original. Use simplified smooth color areas with defined edges — slightly stylized, not photorealistic. No texture, grain, noise, or brush strokes. Show only the vehicle, with no background objects, people, scenery, or shadows.",
  carPlatePreserve:
    " The license plate is the most important detail: keep it clearly visible and fully legible, preserving every character exactly as it appears in the original photo.",
  carPlateRemove:
    " Remove the license plate completely so the vehicle has no number plate visible.",
  carPlateText: (plate: string) =>
    ` The license plate is the most important detail: show it clearly displaying the exact text '${plate}', preserving those characters precisely.`,
  fallback:
    "Render the most prominent subject of this photo as a clean artistic illustration on a plain background, showing only the subject with no background objects or scenery.",
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY_PROMPTS — pre-rewrite versions, saved 2026-06-08.
// Kept verbatim for rollback. Set USE_LEGACY_PROMPTS = true above to use these.
// DO NOT DELETE.
// ─────────────────────────────────────────────────────────────────────────────
const LEGACY_PROMPTS = {
  outlineBlack:
    "make closest objects (humans,dogs,cars) whichever are most significant to picture to outlined picture with only thick bold white thread on plain black background. not too many lines. remove lines from face keep only outer silhouette of face features. maximum 8 clean bold lines per subject. like a one-line tattoo with thick visible lines. no hoodie no clothing no background objects just the subjects on solid black. no stray lines at all. no horizontal lines. no ground lines. no base lines. no pedestal lines. no lines extending below the subject. no floor or surface lines. the outline must float on the background with nothing underneath it. only draw the actual subject shape nothing else. lines must be thick and clearly visible. the bottom of the subject should end cleanly with no extra lines trailing downward. no rectangular border around the image. no frame. no canvas edge. no bounding box. no box outline. do not draw a rectangle around the composition. no borders. no frames. no boxes. no rectangles. no dividing lines. no baseline. no underline. absolutely no horizontal line across the bottom of the image.",
  outlineWhite:
    "make closest objects (humans,dogs,cars) whichever are most significant to picture to outlined picture with only thick bold black thread on plain white background. not too many lines. remove lines from face keep only outer silhouette of face features. maximum 8 clean bold lines per subject. like a one-line tattoo with thick visible lines. no hoodie no clothing no background objects just the subjects on solid white. no stray lines at all. no horizontal lines. no ground lines. no base lines. no pedestal lines. no lines extending below the subject. no floor or surface lines. the outline must float on the background with nothing underneath it. only draw the actual subject shape nothing else. lines must be thick and clearly visible. the bottom of the subject should end cleanly with no extra lines trailing downward. no rectangular border around the image. no frame. no canvas edge. no bounding box. no box outline. do not draw a rectangle around the composition. no borders. no frames. no boxes. no rectangles. no dividing lines. no baseline. no underline. absolutely no horizontal line across the bottom of the image.",
  // PREVIOUS standard prompt (kept for reference, do not delete):
  // "convert the main subject of this image into a simple flat color vector graphic. keep ALL original colors exactly as they are including white and black. maximum 8 solid colors, clean hard edges, no gradients, no shading, no texture, no stitching, no thread texture. flat smooth solid colors only, like a clean vector graphic. solid white background. only the main subject."
  standard:
    "keep the main logo or subject of this image EXACTLY as it is. Do not redraw it. Do not stylize it. Do not simplify it. Do not change colors. Do not change shapes. Do not add or remove details. Preserve every single detail, line, color, gradient, and texture identical to the original. Only isolate the logo from its background by placing it on a solid pure white background. The logo itself must look 100% identical to the original input. Pixel-perfect reproduction of the original logo on white background. Only the main logo, no scenery, no extra objects.",
  petHead:
    "extract just the head of the pet from this photo. Keep the exact same facial expression, tongue position, eye shape, and all facial features identical to the original photo. Create a clean smooth digital portrait of just the pet head on solid pure white background (#FFFFFF). Head and face only, no body. Smooth clean colors, no texture, no brush strokes, no grain. Sharp clean edges. Do not change or alter any facial features. Pure white background only, no shadows, no objects, no scenery.",
  carBase:
    "take the car or vehicle from this photo. Keep the exact same shape, proportions, body lines, wheels, and all details identical to the original photo. Convert into a clean digital illustration with simplified smooth color areas and defined edges. Slightly stylized, not photorealistic. Solid pure white background (#FFFFFF). No texture, no brush strokes, no grain, no noise. Only the vehicle, no background objects, no people, no scenery, no shadows.",
  carPlatePreserve:
    " License plate must be clearly visible and fully legible — the number plate text is the most important detail, preserve every character on the number plate exactly as it appears in the original photo.",
  carPlateRemove:
    " No license plate, completely remove license plate, clean car without any number plate visible.",
  carPlateText: (plate: string) =>
    ` License plate clearly visible showing exact text '${plate}', number plate is the most important detail, preserve exact plate characters.`,
  fallback:
    "make closest objects whichever are most significant to picture into an artistic rendering. no background objects.",
};

// Active prompt set, chosen by the rollback switch above.
const P = USE_LEGACY_PROMPTS ? LEGACY_PROMPTS : NEW_PROMPTS;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, style, garmentColor, licensePlate } = body;

    if (!imageUrl || !style) {
      return NextResponse.json({ error: "Missing imageUrl or style" }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "REPLICATE_API_TOKEN is not configured" }, { status: 500 });
    }

    let prompt = "";

    if (style === "outline") {
      prompt = garmentColor === "black" ? P.outlineBlack : P.outlineWhite;
    } else if (style === "standard") {
      prompt = P.standard;
    } else if (style === "pet-head") {
      prompt = P.petHead;
    } else if (style === "car") {
      if (licensePlate === undefined || licensePlate === null) {
        prompt = P.carBase + P.carPlatePreserve;
      } else if (licensePlate === "") {
        prompt = P.carBase + P.carPlateRemove;
      } else {
        prompt = P.carBase + P.carPlateText(licensePlate);
      }
    } else {
      prompt = P.fallback;
    }

    const response = await fetch(
      "https://api.replicate.com/v1/models/google/nano-banana/predictions",
      {
        method: "POST",
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
          "Prefer": "wait=60"
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            image_input: [imageUrl],
            aspect_ratio: "match_input_image",
            output_format: "png"
          }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

    let outputUrl = null;
    if (data.output) {
      outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    } else if (data.urls?.get) {
      let result = data;
      for (let i = 0; i < 30; i++) {
        if (result.status === "succeeded") break;
        if (result.status === "failed") {
          return NextResponse.json({ error: "Generation failed" }, { status: 500 });
        }
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(data.urls.get, {
          headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` }
        });
        result = await poll.json();
      }
      outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    }

    return NextResponse.json({ imageUrl: outputUrl });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
