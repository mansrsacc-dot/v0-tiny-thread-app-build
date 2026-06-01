import type { Style, Color } from "@/lib/garment-images";

export async function cropTransparentPadding(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, img.width, img.height);
      let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          if (data[(y * img.width + x) * 4 + 3] > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (minX >= maxX || minY >= maxY) { resolve(dataUrl); return; }
      const pad = Math.ceil(Math.max(img.width, img.height) * 0.05);
      const x0 = Math.max(0, minX - pad), y0 = Math.max(0, minY - pad);
      const x1 = Math.min(img.width, maxX + pad + 1), y1 = Math.min(img.height, maxY + pad + 1);
      const cw = x1 - x0, ch = y1 - y0;
      const out = document.createElement("canvas");
      out.width = cw; out.height = ch;
      out.getContext("2d")!.drawImage(canvas, x0, y0, cw, ch, 0, 0, cw, ch);
      resolve(out.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function compressImage(base64: string, maxWidth = 1024): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round(h * maxWidth / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export function createThumbnail(src: string, maxDim = 200): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const scale = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

export async function removeImageBackground(imageUrl: string, styleType: Style, garmentColor: Color): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(imageUrl); return; }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      if (styleType === "standard") {
        // Edge-connected flood fill: only remove white pixels reachable from the image border.
        // Interior white elements (e.g. camera ring inside a logo) are enclosed by colored
        // pixels and are NOT reachable from the edges, so they are preserved.
        const W = canvas.width, H = canvas.height;
        const n = W * H;
        const visited = new Uint8Array(n);
        const queue: number[] = [];

        const tryEnqueue = (px: number) => {
          if (visited[px]) return;
          const i = px * 4;
          if (data[i + 3] > 0 && Math.min(data[i], data[i + 1], data[i + 2]) > 220) {
            visited[px] = 1;
            queue.push(px);
          }
        };

        for (let x = 0; x < W; x++) { tryEnqueue(x); tryEnqueue((H - 1) * W + x); }
        for (let y = 1; y < H - 1; y++) { tryEnqueue(y * W); tryEnqueue(y * W + W - 1); }

        let qi = 0;
        while (qi < queue.length) {
          const cur = queue[qi++];
          const cy = Math.floor(cur / W), cx = cur % W;
          if (cx > 0)     tryEnqueue(cur - 1);
          if (cx < W - 1) tryEnqueue(cur + 1);
          if (cy > 0)     tryEnqueue(cur - W);
          if (cy < H - 1) tryEnqueue(cur + W);
        }

        for (let idx = 0; idx < n; idx++) {
          if (!visited[idx]) continue;
          const i = idx * 4;
          const minRGB = Math.min(data[i], data[i + 1], data[i + 2]);
          if (minRGB > 245) {
            data[i + 3] = 0;
          } else if (minRGB > 220) {
            data[i + 3] = Math.round(((255 - minRGB) / (255 - 220)) * 255);
          }
        }
      } else {
        const threshold = 40;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (styleType === "outline") {
            if (garmentColor === "black") {
              if (r < threshold && g < threshold && b < threshold) data[i + 3] = 0;
            } else {
              if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) data[i + 3] = 0;
            }
          } else if (styleType === "pet-head" || styleType === "car") {
            if (r < threshold && g < threshold && b < threshold) data[i + 3] = 0;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

export function submitCartForm(items: Array<{ id: string; quantity: number; properties?: Record<string, string> }>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://tinythread.lv/cart/add";
  form.style.display = "none";
  const add = (name: string, value: string) => {
    const el = document.createElement("input");
    el.type = "hidden";
    el.name = name;
    el.value = value;
    form.appendChild(el);
  };
  items.forEach(item => {
    add("items[][id]", item.id);
    add("items[][quantity]", String(item.quantity));
    for (const [k, v] of Object.entries(item.properties ?? {})) {
      add("items[][properties][" + k + "]", v);
    }
  });
  add("return_to", "/?added=true");
  document.body.appendChild(form);
  form.submit();
}
