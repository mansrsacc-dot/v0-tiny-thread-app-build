import type { Style, View, Size } from "@/lib/garment-images";

export interface Design {
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
  processedHistory: Record<string, string[]>;
  currentHistoryIndex: Record<string, number>;
  regenerationCount: number;
  rawImageUrl: string | null;
  rotation: number;
  textContent?: string;
  textFont?: string;
  textColor?: string;
  textMultiRow?: boolean;
  licensePlate?: string;
  savedDesignId?: string;
}

export type AddingMode = {
  context: "additional" | "back";
  step: "size" | "style" | "upload";
  size?: "S" | "M";
} | null;

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};
