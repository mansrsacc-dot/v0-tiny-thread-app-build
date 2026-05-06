import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, style, garmentColor } = body;

    if (!imageUrl || !style) {
      return NextResponse.json({ error: "Missing imageUrl or style" }, { status: 400 });
    }

    let prompt = "";

    if (style === "outline") {
      if (garmentColor === "black") {
        prompt = "make closest objects (humans,dogs,cars) whichever are most significant to picture to outlined picture with only thick bold white thread on plain black background. not too many lines. remove lines from face keep only outer silhouette of face features. maximum 8 clean bold lines per subject. like a one-line tattoo with thick visible lines. no hoodie no clothing no background objects just the subjects on solid black. no stray lines at all. no horizontal lines. no ground lines. no base lines. no pedestal lines. no lines extending below the subject. no floor or surface lines. the outline must float on the background with nothing underneath it. only draw the actual subject shape nothing else. lines must be thick and clearly visible. the bottom of the subject should end cleanly with no extra lines trailing downward.";
      } else {
        prompt = "make closest objects (humans,dogs,cars) whichever are most significant to picture to outlined picture with only thick bold black thread on plain white background. not too many lines. remove lines from face keep only outer silhouette of face features. maximum 8 clean bold lines per subject. like a one-line tattoo with thick visible lines. no hoodie no clothing no background objects just the subjects on solid white. no stray lines at all. no horizontal lines. no ground lines. no base lines. no pedestal lines. no lines extending below the subject. no floor or surface lines. the outline must float on the background with nothing underneath it. only draw the actual subject shape nothing else. lines must be thick and clearly visible. the bottom of the subject should end cleanly with no extra lines trailing downward.";
      }
    } else if (style === "standard") {
      // PREVIOUS PROMPT (kept for reference, do not delete):
      // "convert the main subject of this image into a simple flat color vector graphic. keep ALL original colors exactly as they are including white and black. maximum 8 solid colors, clean hard edges, no gradients, no shading, no texture, no stitching, no thread texture. flat smooth solid colors only, like a clean vector graphic. solid white background. only the main subject."
      prompt = "keep the main logo or subject of this image EXACTLY as it is. Do not redraw it. Do not stylize it. Do not simplify it. Do not change colors. Do not change shapes. Do not add or remove details. Preserve every single detail, line, color, gradient, and texture identical to the original. Only isolate the logo from its background by placing it on a solid pure white background. The logo itself must look 100% identical to the original input. Pixel-perfect reproduction of the original logo on white background. Only the main logo, no scenery, no extra objects.";
    } else if (style === "pet-head") {
      prompt = "extract just the head of the pet from this photo. Keep the exact same facial expression, tongue position, eye shape, and all facial features identical to the original photo. Create a clean smooth digital portrait of just the pet head on solid pure white background (#FFFFFF). Head and face only, no body. Smooth clean colors, no texture, no brush strokes, no grain. Sharp clean edges. Do not change or alter any facial features. Pure white background only, no shadows, no objects, no scenery.";
    } else if (style === "car") {
      prompt = "take the car or vehicle from this photo. Keep the exact same shape, proportions, body lines, wheels, and all details identical to the original photo. Convert into a clean digital illustration with simplified smooth color areas and defined edges. Slightly stylized, not photorealistic. Solid pure white background (#FFFFFF). No texture, no brush strokes, no grain, no noise. Only the vehicle, no background objects, no people, no scenery, no shadows.";
    } else {
      prompt = "make closest objects whichever are most significant to picture into an artistic rendering. no background objects.";
    }

    const response = await fetch(
      "https://api.replicate.com/v1/models/google/nano-banana/predictions",
      {
        method: "POST",
        headers: {
          "Authorization": "Token r8_PFYa3C43H9QqKJVLFieVDKnfPhGr7ep4ceA1H",
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
          headers: { "Authorization": "Token r8_PFYa3C43H9QqKJVLFieVDKnfPhGr7ep4ceA1H" }
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
