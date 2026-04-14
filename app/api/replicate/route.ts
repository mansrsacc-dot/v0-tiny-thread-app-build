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
      prompt = "convert the main subject of this image into a simple flat color vector graphic. keep ALL original colors exactly as they are including white and black. maximum 8 solid colors, clean hard edges, no gradients, no shading, no texture, no stitching, no thread texture. flat smooth solid colors only, like a clean vector graphic. solid white background. only the main subject.";
    } else if (style === "photo-stitch") {
      prompt = "make closest objects (humans,dogs,cars) whichever are most significant to picture to embroided on black background";
    } else if (style === "pet-head") {
      prompt = "take only the head of the main animal or pet in this picture and create a detailed embroidered portrait of just the head on black background. show only the head and face with dense colorful thread stitches following fur direction. photorealistic thread painting embroidery of the pet head only. no body no background just the head floating on solid black.";
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
