"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GARMENT_IMAGES, SIZE_CONSTRAINTS, STYLES, type Product, type Color, type View, type Size, type Style } from "@/lib/garment-images";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Shopify Storefront API config
const SHOPIFY_STORE = "tinythread-2.myshopify.com";
const STOREFRONT_TOKEN = "190fa68ec00aa40fb44afbb51c4b70e7";

// Product variant IDs - map from product+color+size+style to variant ID
const VARIANT_IDS: Record<string, string> = {
  // Hoodie Black
  "hoodie-black-S-outline": "gid://shopify/ProductVariant/56937201041739",
  "hoodie-black-S-standard": "gid://shopify/ProductVariant/56937201074507",
  "hoodie-black-S-photo-stitch": "gid://shopify/ProductVariant/56937201107275",
  "hoodie-black-S-pet-head": "gid://shopify/ProductVariant/56937201140043",
  "hoodie-black-M-outline": "gid://shopify/ProductVariant/56937201172811",
  "hoodie-black-M-standard": "gid://shopify/ProductVariant/56937201205579",
  "hoodie-black-M-photo-stitch": "gid://shopify/ProductVariant/56937201238347",
  "hoodie-black-M-pet-head": "gid://shopify/ProductVariant/56937201271115",
  "hoodie-black-L-outline": "gid://shopify/ProductVariant/56937201303883",
  "hoodie-black-L-standard": "gid://shopify/ProductVariant/56937201336651",
  "hoodie-black-L-photo-stitch": "gid://shopify/ProductVariant/56937201369419",
  "hoodie-black-L-pet-head": "gid://shopify/ProductVariant/56937201402187",
  // Hoodie White
  "hoodie-white-S-outline": "gid://shopify/ProductVariant/56937179152715",
  "hoodie-white-S-standard": "gid://shopify/ProductVariant/56937179185483",
  "hoodie-white-S-photo-stitch": "gid://shopify/ProductVariant/56937179218251",
  "hoodie-white-S-pet-head": "gid://shopify/ProductVariant/56937179251019",
  "hoodie-white-M-outline": "gid://shopify/ProductVariant/56937179283787",
  "hoodie-white-M-standard": "gid://shopify/ProductVariant/56937179316555",
  "hoodie-white-M-photo-stitch": "gid://shopify/ProductVariant/56937179349323",
  "hoodie-white-M-pet-head": "gid://shopify/ProductVariant/56937179382091",
  "hoodie-white-L-outline": "gid://shopify/ProductVariant/56937193275723",
  "hoodie-white-L-standard": "gid://shopify/ProductVariant/56937193308491",
  "hoodie-white-L-photo-stitch": "gid://shopify/ProductVariant/56937193341259",
  "hoodie-white-L-pet-head": "gid://shopify/ProductVariant/56937193374027",
  // Cap Black
  "cap-black-S-outline": "gid://shopify/ProductVariant/56937206317387",
  "cap-black-S-standard": "gid://shopify/ProductVariant/56937206350155",
  "cap-black-S-photo-stitch": "gid://shopify/ProductVariant/56937206382923",
  "cap-black-S-pet-head": "gid://shopify/ProductVariant/56937206415691",
  "cap-black-M-outline": "gid://shopify/ProductVariant/56937206448459",
  "cap-black-M-standard": "gid://shopify/ProductVariant/56937206481227",
  "cap-black-M-photo-stitch": "gid://shopify/ProductVariant/56937206513995",
  "cap-black-M-pet-head": "gid://shopify/ProductVariant/56937206546763",
  // Cap White
  "cap-white-S-outline": "gid://shopify/ProductVariant/56937204482379",
  "cap-white-S-standard": "gid://shopify/ProductVariant/56937204515147",
  "cap-white-S-photo-stitch": "gid://shopify/ProductVariant/56937204547915",
  "cap-white-S-pet-head": "gid://shopify/ProductVariant/56937204580683",
  "cap-white-M-outline": "gid://shopify/ProductVariant/56937204613451",
  "cap-white-M-standard": "gid://shopify/ProductVariant/56937204646219",
  "cap-white-M-photo-stitch": "gid://shopify/ProductVariant/56937204678987",
  "cap-white-M-pet-head": "gid://shopify/ProductVariant/56937204711755",
};

// Pricing based on product, style, and size
const PRICING: Record<string, Record<string, Record<string, number>>> = {
  hoodie: {
    outline:        { S: 59, M: 69, L: 99 },
    standard:       { S: 69, M: 79, L: 109 },
    "photo-stitch": { S: 79, M: 89, L: 129 },
    "pet-head":     { S: 79, M: 89, L: 129 },
  },
  cap: {
    outline:        { S: 39, M: 49 },
    standard:       { S: 45, M: 55 },
    "photo-stitch": { S: 55, M: 65 },
    "pet-head":     { S: 55, M: 65 },
  }
};

declare global {
  interface Window {
    __tinyThreadOrder?: unknown;
  }
}

interface Design {
  id: string;
  originalImage: string;
  style: Style;
  view: View;
  size: Size;
  currentSizePx: number;
  position: { x: number; y: number };
  generatedImages: Record<string, string>;
  processedImages: Record<string, string>;
  removeBackground: boolean;
  generationHistory: Record<string, string[]>;
  currentHistoryIndex: Record<string, number>;
  regenerationCount: number;
}

export default function TinyThreadStudio() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [product, setProduct] = useState<Product>("hoodie");
  const [color, setColor] = useState<Color>("black");
  const [view, setView] = useState<View>("front");
  const [size, setSize] = useState<Size>("S");
  const [style, setStyle] = useState<Style>("photo-stitch");
  const [removeBackground, setRemoveBackground] = useState(true);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStitched, setShowStitched] = useState(false);
  const [dragState, setDragState] = useState<{ isDragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const [resizeState, setResizeState] = useState<{ isResizing: boolean; startX: number; startY: number; startSize: number } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationLockRef = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedDesign = designs.find(d => d.id === selectedDesignId);
  const currentDesignsForView = designs.filter(d => d.view === view);
  const currentPrice = PRICING[product]?.[style]?.[size] || 0;

  // Read URL parameters to pre-select product and color
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlProduct = params.get("product");
    const urlColor = params.get("color");
    
    if (urlProduct === "hoodie" || urlProduct === "cap") {
      setProduct(urlProduct);
    }
    if (urlColor === "black" || urlColor === "white") {
      setColor(urlColor);
    }
  }, []);

  const getGarmentImage = () => {
    if (product === "cap") {
      return GARMENT_IMAGES.cap[color]?.front || GARMENT_IMAGES.cap.black.front;
    }
    return GARMENT_IMAGES[product][color][view];
  };

  const removeImageBackground = useCallback(async (imageUrl: string, styleType: Style, garmentColor: Color): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const threshold = 40;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (styleType === "outline") {
            if (garmentColor === "black") {
              if (r < threshold && g < threshold && b < threshold) {
                data[i + 3] = 0;
              }
            } else {
              if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) {
                data[i + 3] = 0;
              }
            }
          } else if (styleType === "standard") {
            if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) {
              data[i + 3] = 0;
            }
          } else if (styleType === "photo-stitch" || styleType === "pet-head") {
            if (r < threshold && g < threshold && b < threshold) {
              data[i + 3] = 0;
            }
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  }, []);

  const generateEmbroidery = useCallback(async (designId: string, imageBase64: string, styleType: Style, isRegenerate = false) => {
    if (generationLockRef.current) return;
    generationLockRef.current = true;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageBase64,
          style: styleType,
          garmentColor: color,
        }),
      });

      const data = await response.json();
      
      if (data.imageUrl) {
        const processed = await removeImageBackground(data.imageUrl, styleType, color);
        
        setDesigns(prev => prev.map(d => {
          if (d.id === designId) {
            const currentHistory = d.generationHistory[styleType] || [];
            const newHistory = [...currentHistory, data.imageUrl];
            const newIndex = newHistory.length - 1;
            
            return {
              ...d,
              generatedImages: { ...d.generatedImages, [styleType]: data.imageUrl },
              processedImages: { ...d.processedImages, [styleType]: processed },
              generationHistory: { ...d.generationHistory, [styleType]: newHistory },
              currentHistoryIndex: { ...d.currentHistoryIndex, [styleType]: newIndex },
            };
          }
          return d;
        }));

        setShowStitched(true);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
      generationLockRef.current = false;
    }
  }, [color, removeImageBackground]);

  const handleFileUpload = useCallback((file: File) => {
    if (designs.length >= 2) {
      alert("Maximum 2 designs allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      console.log("[UPLOAD] Base64 length:", base64.length);
      
      if (base64.length < 1000) {
        alert("Error: Image data too small");
        return;
      }

      const newDesign: Design = {
        id: `design-${Date.now()}`,
        originalImage: base64,
        style: style,
        view: view,
        size: size,
        currentSizePx: SIZE_CONSTRAINTS[size].min + (SIZE_CONSTRAINTS[size].max - SIZE_CONSTRAINTS[size].min) / 2,
        position: { x: 50, y: 40 },
        generatedImages: {},
        processedImages: {},
        removeBackground: removeBackground,
        generationHistory: {},
        currentHistoryIndex: {},
        regenerationCount: 0,
      };

      setDesigns(prev => [...prev, newDesign]);
      setSelectedDesignId(newDesign.id);
      
      generateEmbroidery(newDesign.id, base64, style);
    };
    reader.readAsDataURL(file);
  }, [designs.length, style, view, size, removeBackground, generateEmbroidery]);

  const handleStyleChange = useCallback((newStyle: Style) => {
    setStyle(newStyle);
    
    if (selectedDesign) {
      setDesigns(prev => prev.map(d => {
        if (d.id === selectedDesign.id) {
          return { ...d, style: newStyle };
        }
        return d;
      }));

      if (!selectedDesign.generatedImages[newStyle]) {
        generateEmbroidery(selectedDesign.id, selectedDesign.originalImage, newStyle);
      }
    }
  }, [selectedDesign, generateEmbroidery]);

  const handleDeleteDesign = useCallback((designId: string) => {
    setDesigns(prev => prev.filter(d => d.id !== designId));
    if (selectedDesignId === designId) {
      setSelectedDesignId(null);
    }
  }, [selectedDesignId]);

  const handleMouseDown = useCallback((e: React.MouseEvent, designId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDesignId(designId);
    const design = designs.find(d => d.id === designId);
    if (design) {
      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: design.position.x,
        startPosY: design.position.y,
      });
    }
  }, [designs]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, designId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const design = designs.find(d => d.id === designId);
    if (design) {
      setResizeState({
        isResizing: true,
        startX: e.clientX,
        startY: e.clientY,
        startSize: design.currentSizePx,
      });
    }
  }, [designs]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState?.isDragging && selectedDesignId && previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100;
        const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100;
        
        setDesigns(prev => prev.map(d => {
          if (d.id === selectedDesignId) {
            return {
              ...d,
              position: {
                x: Math.max(0, Math.min(100, dragState.startPosX + deltaX)),
                y: Math.max(0, Math.min(100, dragState.startPosY + deltaY)),
              },
            };
          }
          return d;
        }));
      }

      if (resizeState?.isResizing && selectedDesignId) {
        const design = designs.find(d => d.id === selectedDesignId);
        if (design) {
          const delta = e.clientX - resizeState.startX;
          const constraints = SIZE_CONSTRAINTS[design.size];
          const newSize = Math.max(constraints.min, Math.min(constraints.max, resizeState.startSize + delta));
          
          setDesigns(prev => prev.map(d => {
            if (d.id === selectedDesignId) {
              return { ...d, currentSizePx: newSize };
            }
            return d;
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
      setResizeState(null);
    };

    if (dragState?.isDragging || resizeState?.isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState, resizeState, selectedDesignId, designs]);

  const getSizeInMm = (sizePx: number, sizeCategory: Size) => {
    const constraints = SIZE_CONSTRAINTS[sizeCategory];
    const ratio = (sizePx - constraints.min) / (constraints.max - constraints.min);
    const mmRange = sizeCategory === "S" ? [45, 100] : sizeCategory === "M" ? [100, 150] : [150, 250];
    return Math.round(mmRange[0] + ratio * (mmRange[1] - mmRange[0]));
  };

  const handleRegenerate = useCallback(() => {
    if (cooldown > 0 || isGenerating || !selectedDesign) return;
    if (selectedDesign.regenerationCount >= 4) return;
    
    // Increment regeneration count
    setDesigns(prev => prev.map(d => {
      if (d.id === selectedDesign.id) {
        return { ...d, regenerationCount: d.regenerationCount + 1 };
      }
      return d;
    }));
    
    setCooldown(20);
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    generateEmbroidery(selectedDesign.id, selectedDesign.originalImage, selectedDesign.style, true);
  }, [cooldown, isGenerating, selectedDesign, generateEmbroidery]);

  const navigateHistory = useCallback(async (direction: "prev" | "next") => {
    if (!selectedDesign) return;
    
    const styleType = selectedDesign.style;
    const history = selectedDesign.generationHistory[styleType] || [];
    const currentIndex = selectedDesign.currentHistoryIndex[styleType] ?? 0;
    
    let newIndex: number;
    if (direction === "prev") {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(history.length - 1, currentIndex + 1);
    }
    
    if (newIndex !== currentIndex && history[newIndex]) {
      const newImageUrl = history[newIndex];
      const processed = await removeImageBackground(newImageUrl, styleType, color);
      
      setDesigns(prev => prev.map(d => {
        if (d.id === selectedDesign.id) {
          return {
            ...d,
            generatedImages: { ...d.generatedImages, [styleType]: newImageUrl },
            processedImages: { ...d.processedImages, [styleType]: processed },
            currentHistoryIndex: { ...d.currentHistoryIndex, [styleType]: newIndex },
          };
        }
        return d;
      }));
    }
  }, [selectedDesign, removeImageBackground, color]);

  // Handle Add to Cart
  const handleAddToCart = useCallback(async () => {
    if (designs.length === 0) {
      toast({ title: "No design", description: "Please upload and generate a design first." });
      return;
    }

    const hasStitched = designs.some(d => d.processedImages[d.style]);
    if (!hasStitched) {
      toast({ title: "Not ready", description: "Please wait for the embroidery preview to generate." });
      return;
    }

    setIsAddingToCart(true);
    try {
      // 1. Build design specs
      const designSpecs = designs.map(d => ({
        view: d.view,
        style: d.style,
        size: d.size,
        sizeMm: d.currentSizePx ? Math.round((d.currentSizePx / 780) * 700) + "mm" : "unknown",
      }));

      // 2. Get variant ID based on product, color, size, and style
      const variantKey = `${product}-${color}-${size}-${style}`;
      const variantId = VARIANT_IDS[variantKey];
      
      if (!variantId) {
        throw new Error("Unknown product variant: " + variantKey);
      }

      console.log("[v0] Creating cart with variant:", variantId);

      // 3. Create Shopify cart via Storefront API
      const mutation = `
        mutation cartCreate($input: CartInput!) {
          cartCreate(input: $input) {
            cart {
              id
              checkoutUrl
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          lines: [
            {
              merchandiseId: variantId,
              quantity: 1,
              attributes: [
                { key: "Embroidery Style", value: designSpecs.map(d => d.style).join(", ") },
                { key: "Embroidery Size", value: designSpecs.map(d => `${d.size} (${d.sizeMm})`).join(", ") },
                { key: "Placement", value: designSpecs.map(d => d.view).join(", ") },
                { key: "Design Count", value: String(designs.length) },
                { key: "Price", value: "€" + currentPrice },
              ]
            }
          ]
        }
      };

      console.log("[v0] Sending to Shopify...");

      const res = await fetch(`https://${SHOPIFY_STORE}/api/2024-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const data = await res.json();
      console.log("[v0] Shopify response:", JSON.stringify(data));

      const cart = data?.data?.cartCreate?.cart;
      const errors = data?.data?.cartCreate?.userErrors;

      if (errors && errors.length > 0) {
        throw new Error(errors.map((e: { message: string }) => e.message).join(", "));
      }

      if (cart?.checkoutUrl) {
        console.log("[v0] Success! Redirecting to:", cart.checkoutUrl);
        const encodedCheckout = encodeURIComponent(cart.checkoutUrl);
        window.location.href = "https://tinythread-2.myshopify.com?added=true&checkout=" + encodedCheckout;
      } else {
        throw new Error("No checkout URL returned from Shopify");
      }

    } catch (error: unknown) {
      console.error("[v0] Add to cart error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({ 
        title: "Error adding to cart", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAddingToCart(false);
    }
  }, [designs, product, color, toast]);

  return (
    <div className={cn("min-h-screen flex flex-col md:flex-row", theme === "dark" ? "dark" : "")}>
      {/* Garment Preview - First on mobile, Second on desktop */}
      <div className={cn(
        "w-full md:flex-1 h-[50vh] md:h-auto order-1 md:order-2 flex flex-col relative",
        theme === "dark" ? "bg-[#0a0a0a]" : "bg-gray-100"
      )}>
        {/* Top Controls - Original/Stitched toggle */}
        <div className="flex justify-end p-2 md:p-4">
          {designs.length > 0 && (
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", theme === "dark" ? "bg-neutral-800" : "bg-white shadow-sm")}>
              <span className={cn("text-xs", !showStitched ? "text-amber-400" : theme === "dark" ? "text-neutral-400" : "text-gray-500")}>Original</span>
              <Switch
                checked={showStitched}
                onCheckedChange={setShowStitched}
              />
              <span className={cn("text-xs", showStitched ? "text-amber-400" : theme === "dark" ? "text-neutral-400" : "text-gray-500")}>Stitched</span>
            </div>
          )}
        </div>

        {/* Garment Preview */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div
            ref={previewRef}
            data-testid="garment-preview"
            className="relative w-full h-full max-w-2xl"
            style={{ cursor: designs.length === 0 ? 'pointer' : 'default' }}
            onClick={(e) => {
              // If no designs, trigger file upload via ref
              if (designs.length === 0 && fileInputRef.current) {
                fileInputRef.current.click();
                return;
              }
              // Only deselect if clicking directly on the preview background, not on a design overlay
              if (e.target === e.currentTarget || e.target instanceof HTMLImageElement) {
                setSelectedDesignId(null);
              }
            }}
          >
            <img
              src={getGarmentImage()}
              alt={`${product} ${color} ${view}`}
              className="w-full h-full object-contain"
            />

            {/* Design Overlays */}
            {currentDesignsForView.map(design => {
              const imageToShow = showStitched && design.removeBackground
                ? design.processedImages[design.style] || design.generatedImages[design.style]
                : showStitched
                  ? design.generatedImages[design.style]
                  : design.originalImage;

              if (!imageToShow) return null;

              return (
                <div
                  key={design.id}
                  style={{
                    position: "absolute",
                    left: `${design.position.x}%`,
                    top: `${design.position.y}%`,
                    transform: "translate(-50%, -50%)",
                    width: design.currentSizePx,
                    height: design.currentSizePx,
                  }}
                  className={cn(
                    "cursor-move group",
                    selectedDesignId === design.id && "ring-2 ring-amber-400"
                  )}
                  onMouseDown={(e) => handleMouseDown(e, design.id)}
                >
                  <img
                    src={imageToShow}
                    alt="Design"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  
                  {selectedDesignId === design.id && (
                    <>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDesign(design.id);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      {/* Resize Handle */}
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, design.id)}
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-sm cursor-se-resize"
                      />
                      
                      {/* Size Indicator */}
                      <div className={cn(
                        "absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded whitespace-nowrap",
                        theme === "dark" ? "bg-neutral-800 text-neutral-300" : "bg-white text-gray-700 shadow-sm"
                      )}>
                        ~{getSizeInMm(design.currentSizePx, design.size)}mm
                      </div>
                      
                      {/* Regenerate & History Controls - Below Design */}
                      {design.generatedImages[design.style] && (
                        <div 
                          className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {/* Regenerate Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerate();
                            }}
                            disabled={cooldown > 0 || isGenerating || design.regenerationCount >= 4}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                              cooldown > 0 || isGenerating || design.regenerationCount >= 4
                                ? "opacity-50 cursor-not-allowed text-neutral-400"
                                : "hover:bg-white/10 text-neutral-200"
                            )}
                          >
                            {isGenerating ? (
                              <Spinner className="w-3 h-3" />
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                            <span>
                              {design.regenerationCount >= 4 
                                ? "Max reached" 
                                : cooldown > 0 
                                  ? `${cooldown}s` 
                                  : `(${4 - design.regenerationCount} left)`}
                            </span>
                          </button>
                          
                          {/* History Navigation */}
                          {(() => {
                            const history = design.generationHistory[design.style] || [];
                            const currentIndex = design.currentHistoryIndex[design.style] ?? 0;
                            
                            if (history.length <= 1) return null;
                            
                            return (
                              <>
                                <div className="w-px h-4 bg-neutral-600" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateHistory("prev");
                                  }}
                                  disabled={currentIndex === 0}
                                  className={cn(
                                    "p-1 rounded transition-all",
                                    currentIndex === 0
                                      ? "opacity-30 cursor-not-allowed"
                                      : "hover:bg-white/10"
                                  )}
                                >
                                  <svg className="w-3 h-3 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <span className="text-xs text-neutral-400 min-w-[28px] text-center">
                                  {currentIndex + 1}/{history.length}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateHistory("next");
                                  }}
                                  disabled={currentIndex === history.length - 1}
                                  className={cn(
                                    "p-1 rounded transition-all",
                                    currentIndex === history.length - 1
                                      ? "opacity-30 cursor-not-allowed"
                                      : "hover:bg-white/10"
                                  )}
                                >
                                  <svg className="w-3 h-3 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Upload Prompt Overlay */}
            {designs.length === 0 && (
              <div 
                className="absolute inset-0 flex items-center justify-center z-10 group cursor-pointer transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Dark overlay that appears on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg" />
                
                {/* Upload prompt - subtle by default, prominent on hover */}
                <div className="relative flex flex-col items-center gap-3 opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105">
                  <div className="w-16 h-16 rounded-full bg-amber-400/20 group-hover:bg-amber-400/30 flex items-center justify-center transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">Click to upload your photo</p>
                    <p className="text-white/40 text-xs mt-1">JPG, PNG — max 10MB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="w-8 h-8 text-amber-400" />
                  <span className="text-white text-sm">Generating embroidery...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Badges - Hidden on mobile */}
        <div className="hidden md:flex justify-center gap-4 p-4">
          <div className={cn(
            "px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider",
            theme === "dark" ? "bg-neutral-800 text-neutral-400" : "bg-white text-gray-500 shadow-sm"
          )}>
            {product.toUpperCase()} · {color.toUpperCase()} · {view.toUpperCase()}
          </div>
          {selectedDesign && (
            <div className={cn(
              "px-3 py-1.5 rounded text-xs font-medium",
              theme === "dark" ? "bg-neutral-800 text-neutral-400" : "bg-white text-gray-500 shadow-sm"
            )}>
              {STYLES.find(s => s.id === selectedDesign.style)?.name} · {selectedDesign.size}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Controls - Second on mobile, First on desktop */}
      <div className={cn(
        "w-full md:w-[280px] md:min-w-[280px] flex-1 md:flex-none order-2 md:order-1 overflow-y-auto border-t md:border-t-0 md:border-r pb-32 md:pb-0",
        theme === "dark" ? "bg-[#0d0d0d] border-neutral-800" : "bg-white border-gray-200"
      )}>
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <span className={cn("font-semibold", theme === "dark" ? "text-white" : "text-gray-900")}>TinyThread</span>
              <span className="text-amber-400 text-xs font-medium">STUDIO</span>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn("p-2 rounded-lg", theme === "dark" ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-gray-100 text-gray-500")}
            >
              {theme === "dark" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <label className={cn("text-xs font-medium uppercase tracking-wider", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              Product
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["hoodie", "cap"] as Product[]).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setProduct(p);
                    if (p === "cap") setView("front");
                  }}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all",
                    product === p
                      ? "border-amber-400 bg-amber-400/10 text-amber-400"
                      : theme === "dark"
                        ? "border-neutral-700 text-neutral-300 hover:border-neutral-600"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {p === "hoodie" ? "Hoodie" : "Cap"}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <label className={cn("text-xs font-medium uppercase tracking-wider", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              Color
            </label>
            <div className="flex gap-3">
              {(["black", "white"] as Color[]).map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    color === c ? "ring-2 ring-amber-400 ring-offset-2" : "",
                    theme === "dark" ? "ring-offset-[#0d0d0d]" : "ring-offset-white",
                    c === "black" ? "bg-black border-neutral-600" : "bg-white border-gray-300"
                  )}
                  title={c.charAt(0).toUpperCase() + c.slice(1)}
                />
              ))}
            </div>
          </div>

          {/* View Selection */}
          {product === "hoodie" && (
            <div className="space-y-2">
              <label className={cn("text-xs font-medium uppercase tracking-wider", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                View
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["front", "back"] as View[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                      view === v
                        ? "border-amber-400 bg-amber-400/10 text-amber-400"
                        : theme === "dark"
                          ? "border-neutral-700 text-neutral-300 hover:border-neutral-600"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div className="space-y-2">
            <label className={cn("text-xs font-medium uppercase tracking-wider", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              Size
            </label>
            <div className={cn("grid gap-2", product === "cap" ? "grid-cols-2" : "grid-cols-3")}>
              {(product === "cap" ? ["S", "M"] as Size[] : ["S", "M", "L"] as Size[]).map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    if (selectedDesign) {
                      setDesigns(prev => prev.map(d => {
                        if (d.id === selectedDesign.id) {
                          const constraints = SIZE_CONSTRAINTS[s];
                          return {
                            ...d,
                            size: s,
                            currentSizePx: constraints.min + (constraints.max - constraints.min) / 2,
                          };
                        }
                        return d;
                      }));
                    }
                  }}
                  className={cn(
                    "py-2 px-2 rounded-lg border text-center transition-all",
                    size === s
                      ? "border-amber-400 bg-amber-400/10"
                      : theme === "dark"
                        ? "border-neutral-700 hover:border-neutral-600"
                        : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn("text-lg font-semibold", size === s ? "text-amber-400" : theme === "dark" ? "text-white" : "text-gray-900")}>{s}</div>
                  <div className={cn("text-[10px]", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>{SIZE_CONSTRAINTS[s].label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <label className={cn("text-xs font-medium uppercase tracking-wider", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              Style
            </label>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleStyleChange(s.id)}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all",
                    style === s.id
                      ? "border-amber-400 bg-amber-400/10"
                      : theme === "dark"
                        ? "border-neutral-700 hover:border-neutral-600"
                        : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn("font-medium text-sm", style === s.id ? "text-amber-400" : theme === "dark" ? "text-white" : "text-gray-900")}>
                    {s.name}
                  </div>
                  <div className={cn("text-xs mt-0.5 hidden md:block", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                    {s.description}
                  </div>
                  <div className={cn("text-xs mt-0.5 hidden md:block", theme === "dark" ? "text-neutral-600" : "text-gray-400")}>
                    Best for: {s.bestFor}
                  </div>
                </button>
              ))}
            </div>
            {style === "pet-head" && (
              <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20">
                <p className="text-xs text-amber-400">This style works best with a single pet face in the photo</p>
              </div>
            )}
            <div className="text-center text-sm mt-2">
              <span className={theme === "dark" ? "text-white/40" : "text-gray-500"}>Price: </span>
              <span className="text-amber-400 font-bold text-lg">{currentPrice > 0 ? `€${currentPrice}` : "—"}</span>
            </div>
          </div>

          {/* Remove Background Toggle */}
          <div className="flex items-center justify-between">
            <label className={cn("text-xs font-medium uppercase tracking-wider", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              Remove Background
            </label>
            <Switch
              checked={removeBackground}
              onCheckedChange={setRemoveBackground}
              disabled={designs.length > 0}
            />
          </div>

          {/* Upload Photo */}
          {designs.length === 0 && (
            <div className="space-y-2">
              <label className={cn("text-xs font-medium uppercase tracking-wider", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                Upload Photo
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                  theme === "dark"
                    ? "border-neutral-700 hover:border-neutral-600"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <svg className={cn("w-8 h-8 mx-auto mb-2", theme === "dark" ? "text-neutral-600" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className={cn("text-sm", theme === "dark" ? "text-neutral-400" : "text-gray-600")}>
                  Drop image or <span className="text-amber-400 hover:underline">browse</span>
                </p>
                <p className={cn("text-xs mt-1", theme === "dark" ? "text-neutral-600" : "text-gray-400")}>
                  JPG, PNG — max 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Design Layers */}
          {designs.length > 0 && (
            <div className="space-y-2">
              <label className={cn("text-xs font-medium uppercase tracking-wider", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                Design Layers
              </label>
              <div className="space-y-2">
                {designs.map(design => (
                  <div
                    key={design.id}
                    onClick={() => setSelectedDesignId(design.id)}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
                      selectedDesignId === design.id
                        ? "border-amber-400 bg-amber-400/10"
                        : theme === "dark"
                          ? "border-neutral-700 hover:border-neutral-600"
                          : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <img
                      src={design.originalImage}
                      alt="Design"
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium truncate", theme === "dark" ? "text-white" : "text-gray-900")}>
                        {STYLES.find(s => s.id === design.style)?.name}
                      </div>
                      <div className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                        {design.view} · {design.size}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDesign(design.id);
                      }}
                      className={cn("p-1 rounded hover:bg-red-500/20 text-red-400")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {designs.length < 2 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full py-2 text-sm border border-dashed rounded-lg transition-all",
                    theme === "dark"
                      ? "border-neutral-700 text-neutral-400 hover:border-neutral-600"
                      : "border-gray-300 text-gray-500 hover:border-gray-400"
                  )}
                >
                  + Add embroidery to another spot
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Add to Cart Button - Desktop (in sidebar flow) */}
          <div className="hidden md:block space-y-1">
            <Button
              data-testid="add-to-cart"
              onClick={handleAddToCart}
              disabled={designs.length === 0 || isAddingToCart}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                <>Add to Cart — €{currentPrice}</>
              )}
            </Button>
            <p className={cn("text-[10px] text-center", theme === "dark" ? "text-white/30" : "text-gray-400")}>
              Your design files will be sent to our embroidery artists
            </p>
          </div>
        </div>
      </div>

      {/* Add to Cart Button - Mobile (sticky at bottom) */}
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 p-3 border-t z-50",
        theme === "dark" ? "bg-[#0d0d0d] border-neutral-800" : "bg-white border-gray-200"
      )}>
        <Button
          data-testid="add-to-cart-mobile"
          onClick={handleAddToCart}
          disabled={designs.length === 0 || isAddingToCart}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding to Cart...
            </>
          ) : (
            <>Add to Cart — €{currentPrice}</>
          )}
        </Button>
      </div>
    </div>
  );
}
