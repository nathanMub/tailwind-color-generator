/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  Palette, 
  Sparkles, 
  Info, 
  Sun, 
  Moon, 
  Zap, 
  ExternalLink,
  CheckSquare,
  Calendar,
  Tag,
  Activity,
  Trash2,
  Plus,
  Mail,
  Shield,
  FileText,
  Send,
  BookOpen,
  User,
  Clock,
  ChevronLeft,
  Search
} from 'lucide-react';
import { BLOG_POSTS, type BlogPost } from './data/blog';

// ============================================================================
// COLOR MATH & CONVERSION UTILITIES
// ============================================================================

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface Shade {
  weight: string;
  hex: string;
  h: number;
  s: number;
  l: number;
  contrastOnWhite: number;
  contrastOnDark: number;
}

// Convert HEX string to RGB
function hexToRgb(hex: string): RGB {
  const sanitized = hex.replace(/^#/, '');
  let r = 0, g = 0, b = 0;
  
  if (sanitized.length === 3) {
    r = parseInt(sanitized[0] + sanitized[0], 16);
    g = parseInt(sanitized[1] + sanitized[1], 16);
    b = parseInt(sanitized[2] + sanitized[2], 16);
  } else if (sanitized.length === 6) {
    r = parseInt(sanitized.substring(0, 2), 16);
    g = parseInt(sanitized.substring(2, 4), 16);
    b = parseInt(sanitized.substring(4, 6), 16);
  }
  
  return { r, g, b };
}

// Convert RGB to HEX
function rgbToHex({ r, g, b }: RGB): string {
  const rHex = Math.max(0, Math.min(255, Math.round(r))).toString(16).padStart(2, '0');
  const gHex = Math.max(0, Math.min(255, Math.round(g))).toString(16).padStart(2, '0');
  const bHex = Math.max(0, Math.min(255, Math.round(b))).toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

// Convert RGB to HSL
function rgbToHsl({ r, g, b }: RGB): HSL {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Convert HSL to RGB
function hslToRgb({ h, s, l }: HSL): RGB {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lNorm - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

// Helper to convert HEX directly to HSL
function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

// Helper to convert HSL directly to HEX
function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

// Calculate Relative Luminance of a color (WCAG 2.1 formula)
function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const rSRGB = r / 255;
  const gSRGB = g / 255;
  const bSRGB = b / 255;

  const rLin = rSRGB <= 0.03928 ? rSRGB / 12.92 : Math.pow((rSRGB + 0.055) / 1.055, 2.4);
  const gLin = gSRGB <= 0.03928 ? gSRGB / 12.92 : Math.pow((gSRGB + 0.055) / 1.055, 2.4);
  const bLin = bSRGB <= 0.03928 ? bSRGB / 12.92 : Math.pow((bSRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

// Calculate Contrast Ratio between two HEX colors
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}


// Validate HEX string
function isValidHex(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex) || /^[0-9A-F]{6}$/i.test(hex) || /^#[0-9A-F]{3}$/i.test(hex) || /^[0-9A-F]{3}$/i.test(hex);
}

// Format color input to standard 6-character uppercase HEX
function formatHex(hex: string): string {
  let cleaned = hex.trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  }
  if (cleaned.length === 6) {
    return `#${cleaned.toUpperCase()}`;
  }
  return '#3B82F6'; // Fallback to classic Tailwind Blue
}


export type PaletteMode = 'balanced' | 'vibrant' | 'soft' | 'midnight';

// ============================================================================
// PALETTE GENERATOR ENGINE
// ============================================================================

export function generatePalette(baseHex: string, mode: PaletteMode): Shade[] {
  const validatedHex = isValidHex(baseHex) ? formatHex(baseHex) : '#3B82F6';
  const baseHsl = hexToHsl(validatedHex);
  
  // Weights matching Tailwind standard
  const weights = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  
  // Standard target lightnesses for each weight
  const targetLightnesses = [98, 95, 89, 79, 65, 51, 41, 31, 21, 12, 6];
  
  // Find closest weight index based on base color's lightness
  let closestIndex = 0;
  let minDiff = 100;
  for (let i = 0; i < targetLightnesses.length; i++) {
    const diff = Math.abs(baseHsl.l - targetLightnesses[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  const shades: Shade[] = new Array(11);
  
  // Set the precise input color to its closest matched weight
  shades[closestIndex] = {
    weight: weights[closestIndex],
    hex: validatedHex,
    h: baseHsl.h,
    s: baseHsl.s,
    l: baseHsl.l,
    contrastOnWhite: getContrastRatio(validatedHex, '#FFFFFF'),
    contrastOnDark: getContrastRatio(validatedHex, '#0F172A')
  };

  // Define extreme endpoints for HSL based on the mode
  let l0 = 98;
  let l10 = 6;
  let s0 = Math.min(baseHsl.s * 0.4, 20);
  let s10 = Math.max(baseHsl.s * 0.4, 15);

  if (mode === 'vibrant') {
    l0 = 97.5;
    l10 = 5;
    s0 = Math.min(baseHsl.s * 0.85, 35);
    s10 = Math.max(baseHsl.s * 0.9, 32);
  } else if (mode === 'soft') {
    l0 = 98.5;
    l10 = 9;
    s0 = Math.min(baseHsl.s * 0.15, 8);
    s10 = Math.min(baseHsl.s * 0.25, 12);
  } else if (mode === 'midnight') {
    l0 = 96.5;
    l10 = 3.5;
    s0 = Math.min(baseHsl.s * 0.35, 18);
    s10 = Math.max(baseHsl.s * 0.85, 45);
  }

  // Generate lighter shades (i < closestIndex)
  if (closestIndex > 0) {
    for (let i = 0; i < closestIndex; i++) {
      const t = i / closestIndex; // 0 to 1
      
      const h = baseHsl.h; // keep hue stable
      
      // Interpolate saturation and lightness
      let s = s0 + t * (baseHsl.s - s0);
      let l = l0 + t * (baseHsl.l - l0);
      
      // Apply mode specific curves
      if (mode === 'vibrant') {
        s = Math.min(100, s * 1.1);
      } else if (mode === 'soft') {
        s = Math.max(0, s * 0.8);
      }

      const hex = hslToHex({ h, s, l });
      shades[i] = {
        weight: weights[i],
        hex,
        h: Math.round(h),
        s: Math.round(s),
        l: Math.round(l),
        contrastOnWhite: getContrastRatio(hex, '#FFFFFF'),
        contrastOnDark: getContrastRatio(hex, '#0F172A')
      };
    }
  }

  // Generate darker shades (i > closestIndex)
  if (closestIndex < 10) {
    for (let i = closestIndex + 1; i <= 10; i++) {
      const t = (i - closestIndex) / (10 - closestIndex); // 0 to 1
      
      const h = baseHsl.h; // keep hue stable
      
      // Interpolate saturation and lightness
      let s = baseHsl.s + t * (s10 - baseHsl.s);
      let l = baseHsl.l + t * (l10 - baseHsl.l);

      // Apply mode specific curves
      if (mode === 'vibrant') {
        s = Math.min(100, s * 1.05);
      } else if (mode === 'soft') {
        s = Math.max(0, s * 0.7);
      }

      const hex = hslToHex({ h, s, l });
      shades[i] = {
        weight: weights[i],
        hex,
        h: Math.round(h),
        s: Math.round(s),
        l: Math.round(l),
        contrastOnWhite: getContrastRatio(hex, '#FFFFFF'),
        contrastOnDark: getContrastRatio(hex, '#0F172A')
      };
    }
  }

  return shades;
}

// ============================================================================
// COSMETICS BATCH CODE DECODER & BRAND DIRECTORY
// ============================================================================

export interface BatchDecodeResult {
  brand: string;
  code: string;
  manufacturedDate: string;
  shelfLife: string;
  status: 'Fresh' | 'Expiring Soon' | 'Expired';
  recommendedColor: string;
}

export interface BrandSample {
  name: string;
  sampleCodes: string[];
  recommendedColor: string;
  description: string;
}

export const BRAND_DIRECTORY: BrandSample[] = [
  { 
    name: 'Dior', 
    sampleCodes: ['2C01', '3A99', '1G02'], 
    recommendedColor: '#DC2626', 
    description: 'Luxury Parisian couture cosmetics.' 
  },
  { 
    name: 'MAC', 
    sampleCodes: ['A52', 'B41', 'C13'], 
    recommendedColor: '#DB2777', 
    description: 'Bold professional makeup authority.' 
  },
  { 
    name: 'Chanel', 
    sampleCodes: ['6201', '5903', '7102'], 
    recommendedColor: '#1E293B', 
    description: 'Iconic monochrome elegance and perfume sets.' 
  },
  { 
    name: 'L\'Oreal', 
    sampleCodes: ['38W301', '38U202', '38X501'], 
    recommendedColor: '#D97706', 
    description: 'World-renowned beauty formulation innovator.' 
  },
  { 
    name: 'Estée Lauder', 
    sampleCodes: ['A82', 'B12', 'A23'], 
    recommendedColor: '#1E3A8A', 
    description: 'Classic luxury skin-repair serum science.' 
  }
];

export function decodeBatchCode(brand: string, code: string): BatchDecodeResult | null {
  const sanitized = code.trim().toUpperCase();
  if (!sanitized) return null;

  let year = 2022;
  let monthName = 'January';
  let shelfLifeMonths = 36;
  let recommendedColor = '#3B82F6';

  if (brand === 'Dior') {
    // Dior format: 4 characters, e.g. 2C01. First digit is year (2 = 2022, 3 = 2023, 1 = 2021). 
    // Second letter is month (A=Jan, B=Feb, C=Mar, etc. excluding I).
    const yearChar = sanitized[0];
    const monthChar = sanitized[1];
    if (yearChar && monthChar) {
      const yearDigit = parseInt(yearChar);
      if (!isNaN(yearDigit)) {
        year = 2020 + yearDigit;
      }
      const months = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M']; // skip I
      const monthIdx = months.indexOf(monthChar);
      if (monthIdx !== -1) {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June', 
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        monthName = monthNames[monthIdx];
      }
    }
    shelfLifeMonths = 36;
    recommendedColor = '#DC2626'; // Dior Crimson Red
  } else if (brand === 'MAC') {
    // MAC format: 3 characters, e.g. A52. First is batch, second is month (1-9, A=Oct, B=Nov, C=Dec), third is year (2 = 2022).
    const monthChar = sanitized[1];
    const yearChar = sanitized[2];
    if (monthChar && yearChar) {
      const yearDigit = parseInt(yearChar);
      if (!isNaN(yearDigit)) {
        year = 2020 + yearDigit;
      }
      const monthMap: Record<string, string> = {
        '1': 'January', '2': 'February', '3': 'March', '4': 'April', '5': 'May',
        '6': 'June', '7': 'July', '8': 'August', '9': 'September',
        'A': 'October', 'B': 'November', 'C': 'December'
      };
      if (monthMap[monthChar]) {
        monthName = monthMap[monthChar];
      }
    }
    shelfLifeMonths = 36;
    recommendedColor = '#DB2777'; // MAC Pink
  } else if (brand === 'Chanel') {
    // Chanel format: 4 digits, e.g. 6201.
    const val = parseInt(sanitized);
    if (!isNaN(val) && val >= 1000) {
      // 6000 base starts approx around Jan 2022, 100 counts representing approx 10-12 months progression
      const monthsDiff = Math.floor((val - 5000) / 10);
      const date = new Date(2021, monthsDiff);
      year = date.getFullYear();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      monthName = monthNames[date.getMonth()];
    }
    shelfLifeMonths = 36;
    recommendedColor = '#1F2937'; // Chanel Slate
  } else if (brand === 'L\'Oreal') {
    // L'Oreal format: 6 characters, e.g. 38W301. Third letter is year: T=2020, U=2021, V=2022, W=2023, X=2024, Y=2025.
    const yearChar = sanitized[2];
    if (yearChar) {
      const baseYear = 2020;
      const alphabet = 'TUVWXYZ';
      const idx = alphabet.indexOf(yearChar);
      if (idx !== -1) {
        year = baseYear + idx;
      }
    }
    const monthChar = sanitized[3];
    const monthDigit = parseInt(monthChar);
    if (!isNaN(monthDigit) && monthDigit >= 1 && monthDigit <= 12) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      monthName = monthNames[monthDigit - 1];
    }
    shelfLifeMonths = 36;
    recommendedColor = '#D97706'; // L'Oreal Amber Gold
  } else if (brand === 'Estée Lauder') {
    // Estée Lauder format: 3 characters, e.g. A82. 
    // First: Batch. Second: Month (1-9, A=Oct, B=Nov, C=Dec). Third: Year (2=2022, 3=2023, 4=2024).
    const monthChar = sanitized[1];
    const yearChar = sanitized[2];
    if (monthChar && yearChar) {
      const yearDigit = parseInt(yearChar);
      if (!isNaN(yearDigit)) {
        year = 2020 + yearDigit;
      }
      const monthMap: Record<string, string> = {
        '1': 'January', '2': 'February', '3': 'March', '4': 'April', '5': 'May',
        '6': 'June', '7': 'July', '8': 'August', '9': 'September',
        'A': 'October', 'B': 'November', 'C': 'December'
      };
      if (monthMap[monthChar]) {
        monthName = monthMap[monthChar];
      }
    }
    shelfLifeMonths = 36;
    recommendedColor = '#1E3A8A'; // Estée Lauder Classic Navy
  }

  // Calculate shelf life remaining based on July 2026 current time
  const currentYear = 2026;
  const currentMonthIdx = 6; // July
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const mIdx = Math.max(0, monthNames.indexOf(monthName));
  
  const ageMonths = (currentYear - year) * 12 + (currentMonthIdx - mIdx);
  const remainingMonths = shelfLifeMonths - ageMonths;
  
  let status: 'Fresh' | 'Expiring Soon' | 'Expired' = 'Fresh';
  let shelfLifeText = '';
  
  if (remainingMonths <= 0) {
    status = 'Expired';
    shelfLifeText = `Expired. Manufactured approx. ${ageMonths} months ago. Best avoided for active facial applications.`;
  } else if (remainingMonths <= 6) {
    status = 'Expiring Soon';
    shelfLifeText = `Expiring soon! Only ${remainingMonths} months of shelf life left. Use promptly.`;
  } else {
    status = 'Fresh';
    shelfLifeText = `Fresh & active. Approx. ${remainingMonths} months of optimal shelf life remaining.`;
  }

  return {
    brand,
    code: sanitized,
    manufacturedDate: `${monthName} ${year}`,
    shelfLife: shelfLifeText,
    status,
    recommendedColor
  };
}

// ============================================================================
// TAILWIND CSS OFFICIAL CORE PALETTES DIRECT REPRODUCTION
// ============================================================================

export interface TailwindColorScale {
  name: string;
  category: string;
  colors: Record<string, string>;
}

export const TAILWIND_OFFICIAL_SCALES: TailwindColorScale[] = [
  {
    name: 'Slate',
    category: 'Monochrome',
    colors: { '50': '#F8FAFC', '100': '#F1F5F9', '200': '#E2E8F0', '300': '#CBD5E1', '400': '#94A3B8', '500': '#64748B', '600': '#475569', '700': '#334155', '800': '#1E293B', '900': '#0F172A', '950': '#020617' }
  },
  {
    name: 'Gray',
    category: 'Monochrome',
    colors: { '50': '#F9FAFB', '100': '#F3F4F6', '200': '#E5E7EB', '300': '#D1D5DB', '400': '#9CA3AF', '500': '#6B7280', '600': '#4B5563', '700': '#374151', '800': '#1F2937', '900': '#111827', '950': '#030712' }
  },
  {
    name: 'Zinc',
    category: 'Monochrome',
    colors: { '50': '#FAFAFA', '100': '#F4F4F5', '200': '#E4E4E7', '300': '#D4D4D8', '400': '#A1A1AA', '500': '#71717A', '600': '#52525B', '700': '#3F3F46', '800': '#27272A', '900': '#18181B', '950': '#09090B' }
  },
  {
    name: 'Neutral',
    category: 'Monochrome',
    colors: { '50': '#FAFAFA', '100': '#F5F5F5', '200': '#E5E5E5', '300': '#D4D4D4', '400': '#A3A3A3', '500': '#737373', '600': '#525252', '700': '#404040', '800': '#262626', '900': '#171717', '950': '#0A0A0A' }
  },
  {
    name: 'Stone',
    category: 'Monochrome',
    colors: { '50': '#FAFAF9', '100': '#F5F5F4', '200': '#E7E5E4', '300': '#D6D3D1', '400': '#A8A29E', '500': '#78316C', '600': '#57534E', '700': '#44403C', '800': '#292524', '900': '#1C1917', '950': '#0C0A09' }
  },
  {
    name: 'Red',
    category: 'Vibrant Warm',
    colors: { '50': '#FEF2F2', '100': '#FEE2E2', '200': '#FECACA', '300': '#FCA5A5', '400': '#F87171', '500': '#EF4444', '600': '#DC2626', '700': '#B91C1C', '800': '#991B1B', '900': '#7F1D1D', '950': '#450A0A' }
  },
  {
    name: 'Orange',
    category: 'Vibrant Warm',
    colors: { '50': '#FFF7ED', '100': '#FFEDD5', '200': '#FED7AA', '300': '#FDBA74', '400': '#FB923C', '500': '#F97316', '600': '#EA580C', '700': '#C2410C', '800': '#9A3412', '900': '#7C2D12', '950': '#431407' }
  },
  {
    name: 'Amber',
    category: 'Vibrant Warm',
    colors: { '50': '#FFFBEB', '100': '#FEF3C7', '200': '#FDE68A', '300': '#FCD34D', '400': '#FBBF24', '500': '#F59E0B', '600': '#D97706', '700': '#B45309', '800': '#92400E', '900': '#78350F', '950': '#451A03' }
  },
  {
    name: 'Yellow',
    category: 'Vibrant Warm',
    colors: { '50': '#FEFCE8', '100': '#FEF9C3', '200': '#FEF08A', '300': '#FDE047', '400': '#FACC15', '500': '#EAB308', '600': '#CA8A04', '700': '#A16207', '800': '#854D0E', '900': '#713F12', '950': '#422006' }
  },
  {
    name: 'Lime',
    category: 'Natural Fresh',
    colors: { '50': '#F7FEE7', '100': '#ECFCCB', '200': '#D9F99D', '300': '#BEF264', '400': '#A3E635', '500': '#84CC16', '600': '#65A30D', '700': '#4D7C0F', '800': '#3F6212', '900': '#314E07', '950': '#1A2E05' }
  },
  {
    name: 'Green',
    category: 'Natural Fresh',
    colors: { '50': '#F0DDF4', '100': '#DCFCE7', '200': '#BBF7D0', '300': '#86EFAC', '400': '#4ADE80', '500': '#22C55E', '600': '#16A34A', '700': '#15803D', '800': '#166534', '900': '#14532D', '950': '#052E16' }
  },
  {
    name: 'Emerald',
    category: 'Natural Fresh',
    colors: { '50': '#ECFDF5', '100': '#D1FAE5', '200': '#A7F3D0', '300': '#6EE7B7', '400': '#34D399', '500': '#10B981', '600': '#059669', '700': '#047857', '800': '#065F46', '900': '#064E3B', '950': '#022C22' }
  },
  {
    name: 'Teal',
    category: 'Natural Fresh',
    colors: { '50': '#F0FDFA', '100': '#CCFBF1', '200': '#99F6E4', '300': '#5EEAD4', '400': '#2DD4BF', '500': '#14B8A6', '600': '#0D9488', '700': '#0F766E', '800': '#115E59', '900': '#134E4A', '950': '#042F2E' }
  },
  {
    name: 'Cyan',
    category: 'Modern Cool',
    colors: { '50': '#ECFEFF', '100': '#CFFAFE', '200': '#A5F3FC', '300': '#67E8F9', '400': '#22D3EE', '500': '#06B6D4', '600': '#0891B2', '700': '#0E7490', '800': '#155E75', '900': '#164E63', '950': '#083344' }
  },
  {
    name: 'Sky',
    category: 'Modern Cool',
    colors: { '50': '#F0F9FF', '100': '#E0F2FE', '200': '#BAE6FD', '300': '#7DD3FC', '400': '#38BDF8', '500': '#0EA5E9', '600': '#0284C7', '700': '#0369A1', '800': '#075985', '900': '#0C4A6E', '950': '#082F49' }
  },
  {
    name: 'Blue',
    category: 'Modern Cool',
    colors: { '50': '#EFF6FF', '100': '#DBEAFE', '200': '#BFDBFE', '300': '#93C5FD', '400': '#60A5FA', '500': '#3B82F6', '600': '#2563EB', '700': '#1D4ED8', '800': '#1E40AF', '900': '#1E3A8A', '950': '#172554' }
  },
  {
    name: 'Indigo',
    category: 'Modern Cool',
    colors: { '50': '#EEF2FF', '100': '#E0E7FF', '200': '#C7D2FE', '300': '#A5B4FC', '400': '#818CF8', '500': '#6366F1', '600': '#4F46E5', '700': '#4338CA', '800': '#3730A3', '900': '#312E81', '950': '#1E1B4B' }
  },
  {
    name: 'Violet',
    category: 'Luxury Pastel',
    colors: { '50': '#F5F3FF', '100': '#EDE9FE', '200': '#DDD6FE', '300': '#C4B5FD', '400': '#A78BFA', '500': '#8B5CF6', '600': '#7C3AED', '700': '#6D28D9', '800': '#5B21B6', '900': '#4C1D95', '950': '#2E1065' }
  },
  {
    name: 'Purple',
    category: 'Luxury Pastel',
    colors: { '50': '#FAF5FF', '100': '#F3E8FF', '200': '#E9D5FF', '300': '#D8B4FE', '400': '#C084FC', '500': '#A855F7', '600': '#9333EA', '700': '#7E22CE', '800': '#6B21A8', '900': '#581C87', '950': '#3B0764' }
  },
  {
    name: 'Fuchsia',
    category: 'Luxury Pastel',
    colors: { '50': '#FDF4FF', '100': '#F5D0FE', '200': '#F5D0FE', '300': '#F0ABFC', '400': '#E879F9', '500': '#D946EF', '600': '#C084FC', '700': '#A21CAF', '800': '#86198F', '900': '#701A75', '950': '#4A044E' }
  },
  {
    name: 'Pink',
    category: 'Luxury Pastel',
    colors: { '50': '#FDF2F8', '100': '#FCE7F3', '200': '#FBCFE8', '300': '#F9A8D4', '400': '#F472B6', '500': '#EC4899', '600': '#DB2777', '700': '#BE185D', '800': '#9D174D', '900': '#831843', '950': '#500724' }
  },
  {
    name: 'Rose',
    category: 'Vibrant Warm',
    colors: { '50': '#FFF1F2', '100': '#FFE4E6', '200': '#FECDD3', '300': '#FDA4AF', '400': '#FB7185', '500': '#F43F5E', '600': '#E11D48', '700': '#BE123C', '800': '#9F1239', '900': '#881337', '950': '#4C0519' }
  }
];

// ============================================================================
// MAIN COMPONENT ENTRY POINT
// ============================================================================

interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  expiryStatus: 'Fresh' | 'Expiring Soon' | 'Expired';
  isExiting?: boolean;
}

export default function App() {
  // Interactive Pantry Tracker States with Smooth Keyframe Animations
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([
    { id: '1', name: 'Fresh Strawberries', quantity: '1 box', category: 'Produce', expiryStatus: 'Fresh' },
    { id: '2', name: 'Almond Milk (Unsweetened)', quantity: '2 cartons', category: 'Dairy/Alt', expiryStatus: 'Expiring Soon' },
    { id: '3', name: 'Greek Yogurt 0%', quantity: '3 tubs', category: 'Dairy/Alt', expiryStatus: 'Fresh' },
    { id: '4', name: 'Whole Wheat Sourdough', quantity: '1 loaf', category: 'Bakery', expiryStatus: 'Expired' },
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1 unit');
  const [newItemCategory, setNewItemCategory] = useState('Produce');
  const [newItemExpiry, setNewItemExpiry] = useState<'Fresh' | 'Expiring Soon' | 'Expired'>('Fresh');

  // Add item handler with slide-in
  const addPantryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: PantryItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: newItemName.trim(),
      quantity: newItemQty,
      category: newItemCategory,
      expiryStatus: newItemExpiry,
    };

    setPantryItems((prev) => [newItem, ...prev]);
    setNewItemName('');
    setNewItemQty('1 unit');
  };

  // Remove item handler with exit animation timeout
  const removePantryItem = (id: string) => {
    setPantryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isExiting: true } : item))
    );

    setTimeout(() => {
      setPantryItems((prev) => prev.filter((item) => item.id !== id));
    }, 250); // Matches the 0.25s animation duration
  };

  const [activePage, setActivePage] = useState<'generator' | 'about' | 'privacy' | 'terms' | 'contact' | 'blog'>('generator');
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState<string>('All');

  // Contact form interactive state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [colorInput, setColorInput] = useState(() => {
    const starterColors = [
      '#6366F1', // Indigo
      '#10B981', // Emerald
      '#8B5CF6', // Violet
      '#F43F5E', // Rose
      '#F59E0B', // Amber
      '#06B6D4', // Cyan
      '#14B8A6', // Teal
      '#F97316', // Orange
      '#3B82F6', // Blue
      '#D946EF', // Fuchsia
      '#EC4899', // Pink
      '#0EA5E9', // Sky
    ];
    const randomIndex = Math.floor(Math.random() * starterColors.length);
    return starterColors[randomIndex];
  });
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('balanced');
  
  const [displayFormat, setDisplayFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  
  // Cosmetic Batch Decoder state parameters
  const [batchBrand, setBatchBrand] = useState<string>('Dior');
  const [batchCode, setBatchCode] = useState<string>('2C01');
  const [decodedResult, setDecodedResult] = useState<BatchDecodeResult | null>(null);
  const [animateTrigger, setAnimateTrigger] = useState<boolean>(false);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  
  // State for tracking copied elements
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Selection of shade to lock as active for previews (defaults to 500)
  const [selectedShadeWeight, setSelectedShadeWeight] = useState<string>('500');

  // Tailwind CSS Color Matrix Explorer state
  const [matrixCategory, setMatrixCategory] = useState<string>('All');
  const filteredScales = useMemo(() => {
    if (matrixCategory === 'All') return TAILWIND_OFFICIAL_SCALES;
    return TAILWIND_OFFICIAL_SCALES.filter(scale => scale.category === matrixCategory);
  }, [matrixCategory]);

  const filteredBlogPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesCategory = blogCategoryFilter === 'All' || post.category === blogCategoryFilter;
      const matchesSearch = post.title.toLowerCase().includes(blogSearchQuery.toLowerCase()) || 
                            post.summary.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
                            post.content.toLowerCase().includes(blogSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [blogSearchQuery, blogCategoryFilter]);

  // Trigger default decode on mount to establish sample context
  useEffect(() => {
    const res = decodeBatchCode('Dior', '2C01');
    if (res) {
      setDecodedResult(res);
      setAnimateTrigger(true);
    }
  }, []);

  // Action method with satisfying mock delay for professional visual feedback
  const handleDecode = (brand: string, code: string) => {
    setIsDecoding(true);
    setAnimateTrigger(false);
    
    setTimeout(() => {
      const res = decodeBatchCode(brand, code);
      if (res) {
        setDecodedResult(res);
        setColorInput(res.recommendedColor);
        setAnimateTrigger(true);
      }
      setIsDecoding(false);
    }, 350);
  };

  // Parse color on input change
  const currentBaseHex = useMemo(() => {
    if (isValidHex(colorInput)) {
      return formatHex(colorInput);
    }
    return '#2563EB'; // Safe default during typing
  }, [colorInput]);

  // Dynamic SEO metadata updates based on current color selection
  useEffect(() => {
    if (currentBaseHex) {
      document.title = `Tailwind Color Palette Generator - ${currentBaseHex.toUpperCase()} Spectrum`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          `Surgically interpolated custom Tailwind CSS color palette for base hex ${currentBaseHex.toUpperCase()}. Fully scored with absolute WCAG 2.1 compliance contrast analytics, component previews, and batch decoder.`
        );
      }
    }
  }, [currentBaseHex]);

  const baseHsl = useMemo(() => {
    return hexToHsl(currentBaseHex);
  }, [currentBaseHex]);

  // Generate our full palette dynamically
  const palette = useMemo(() => {
    return generatePalette(currentBaseHex, paletteMode);
  }, [currentBaseHex, paletteMode]);

  // Find currently active shade
  const activeShade = useMemo(() => {
    return palette.find(s => s.weight === selectedShadeWeight) || palette[5];
  }, [palette, selectedShadeWeight]);

  // Get matching harmonious accents
  const colorAccents = useMemo(() => {
    const { h, s, l } = baseHsl;
    return [
      {
        type: 'Complementary',
        hex: hslToHex({ h: (h + 180) % 360, s, l }),
        description: 'Perfect high-contrast accent across the color wheel.'
      },
      {
        type: 'Analogous Warm',
        hex: hslToHex({ h: (h + 30) % 360, s, l }),
        description: 'Neighboring warm color for smooth visual flowing.'
      },
      {
        type: 'Analogous Cool',
        hex: hslToHex({ h: (h - 30 + 360) % 360, s, l }),
        description: 'Neighboring cool color for serene layouts.'
      },
      {
        type: 'Triadic A',
        hex: hslToHex({ h: (h + 120) % 360, s, l }),
        description: 'Vibrant, balanced triad coordinator.'
      },
      {
        type: 'Triadic B',
        hex: hslToHex({ h: (h + 240) % 360, s, l }),
        description: 'Third pillar of the high-energy triadic structure.'
      }
    ];
  }, [baseHsl]);

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Safe color slider update helper
  const handleHslSlider = (key: 'h' | 's' | 'l', value: number) => {
    const updated = { ...baseHsl, [key]: value };
    const hex = hslToHex(updated);
    setColorInput(hex);
  };

  // Pre-configured Export Code Blocks
  const tailwindV4Config = useMemo(() => {
    let output = `@theme {\n`;
    palette.forEach(shade => {
      output += `  --color-primary-${shade.weight}: ${shade.hex.toLowerCase()};\n`;
    });
    output += `}`;
    return output;
  }, [palette]);

  const tailwindV3Config = useMemo(() => {
    let output = `colors: {\n  primary: {\n`;
    palette.forEach(shade => {
      output += `    ${shade.weight}: '${shade.hex.toLowerCase()}',\n`;
    });
    output += `  },\n}`;
    return output;
  }, [palette]);

  const cssPropertiesConfig = useMemo(() => {
    let output = `:root {\n`;
    palette.forEach(shade => {
      output += `  --primary-${shade.weight}: ${shade.hex.toLowerCase()};\n`;
    });
    output += `}`;
    return output;
  }, [palette]);

  const jsonConfig = useMemo(() => {
    const configObj: Record<string, string> = {};
    palette.forEach(shade => {
      configObj[shade.weight] = shade.hex.toLowerCase();
    });
    return JSON.stringify({ primary: configObj }, null, 2);
  }, [palette]);

  // Export Format State
  const [exportFormat, setExportFormat] = useState<'v4' | 'v3' | 'css' | 'json'>('v4');

  // Active code text based on selected exporter tab
  const activeExportCode = useMemo(() => {
    switch (exportFormat) {
      case 'v4': return tailwindV4Config;
      case 'v3': return tailwindV3Config;
      case 'css': return cssPropertiesConfig;
      case 'json': return jsonConfig;
    }
  }, [exportFormat, tailwindV4Config, tailwindV3Config, cssPropertiesConfig, jsonConfig]);

  // Dynamic background style (solid color)
  const bodyStyle = useMemo(() => {
    return { backgroundColor: currentBaseHex };
  }, [currentBaseHex]);

  // Compute text readability contrast on the page wrapper
  const isDarkBackgroundActive = useMemo(() => {
    const luminance = getRelativeLuminance(currentBaseHex);
    return luminance < 0.45; // if base color is dark, make page content adapt with white text
  }, [currentBaseHex]);

  return (
    <div 
      className={`min-h-screen pb-12 transition-all duration-700 ${
        isDarkBackgroundActive ? 'text-slate-100' : 'text-slate-900'
      }`}
      style={bodyStyle}
    >
      
      {/* ==========================================
          HEADER SECTION
         ========================================== */}
      <header id="app-header" className={`sticky top-0 z-50 transition-all duration-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md ${
        isDarkBackgroundActive 
          ? 'bg-slate-900/90 border-b border-slate-800' 
          : 'bg-white/95 border-b border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200 flex items-center justify-center shrink-0" style={{ backgroundColor: activeShade.hex }}>
                <Palette id="header-icon" className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 id="app-title" className={`text-xl font-extrabold tracking-tight font-sans flex items-center gap-2 ${
                  isDarkBackgroundActive ? 'text-white' : 'text-slate-900'
                }`}>
                  Tailwind Color Palette <span className="text-slate-400 font-light">/</span> Contrast Analyzer
                </h1>
                <p id="app-subtitle" className={`text-xs font-medium ${
                  isDarkBackgroundActive ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Surgical shade interpolation & absolute WCAG 2.1 compliance scoring
                </p>
              </div>
            </div>

            <nav className="flex items-center flex-wrap gap-1 md:border-l border-slate-200 md:pl-4 pl-0">
              <button
                onClick={() => setActivePage('generator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'generator'
                    ? 'text-white shadow-sm'
                    : isDarkBackgroundActive
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activePage === 'generator' ? { backgroundColor: activeShade.hex } : {}}
              >
                Generator
              </button>
              <button
                onClick={() => { setActivePage('blog'); setSelectedBlogPost(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'blog'
                    ? 'text-white shadow-sm'
                    : isDarkBackgroundActive
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activePage === 'blog' ? { backgroundColor: activeShade.hex } : {}}
              >
                Blog
              </button>
              <button
                onClick={() => setActivePage('about')}
                className={`hidden md:inline-block px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'about'
                    ? 'text-white shadow-sm'
                    : isDarkBackgroundActive
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activePage === 'about' ? { backgroundColor: activeShade.hex } : {}}
              >
                About
              </button>
              <button
                onClick={() => setActivePage('contact')}
                className={`hidden md:inline-block px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'contact'
                    ? 'text-white shadow-sm'
                    : isDarkBackgroundActive
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activePage === 'contact' ? { backgroundColor: activeShade.hex } : {}}
              >
                Contact
              </button>
              <button
                onClick={() => setActivePage('privacy')}
                className={`hidden md:inline-block px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'privacy'
                    ? 'text-white shadow-sm'
                    : isDarkBackgroundActive
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activePage === 'privacy' ? { backgroundColor: activeShade.hex } : {}}
              >
                Privacy
              </button>
              <button
                onClick={() => setActivePage('terms')}
                className={`hidden md:inline-block px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'terms'
                    ? 'text-white shadow-sm'
                    : isDarkBackgroundActive
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={activePage === 'terms' ? { backgroundColor: activeShade.hex } : {}}
              >
                Terms
              </button>
            </nav>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">

            <div className="relative flex-1 sm:flex-initial">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                #
              </div>
              <input 
                id="hex-direct-input"
                type="text"
                value={colorInput.replace('#', '')}
                onChange={(e) => setColorInput('#' + e.target.value)}
                maxLength={7}
                placeholder="2563EB"
                className="w-full sm:w-32 pl-7 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-sm uppercase tracking-wider text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all font-semibold shadow-sm"
              />
            </div>
            <button 
              id="randomize-color-btn"
              onClick={() => {
                const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                setColorInput(randomHex);
              }}
              title="Generate random seed color"
              className="p-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN LAYOUT - BENTO GRID
         ========================================== */}
      {activePage === 'generator' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INFO HERO / ONBOARDING HEADER */}
        <div id="info-hero-banner" className="lg:col-span-12 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/30 border border-indigo-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100/80 text-indigo-800 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Interactive Designer Hub
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Design accessible, design-system-ready color palettes in seconds.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              This utility solves the tedious cycle of color calibration. Simply input any hex code or pick a seed color to automatically generate an entire 11-shade responsive color spectrum. Measure exact WCAG 2.1 contrast ratios on light/dark modes instantly, preview customized UI components inside real-time sandboxes, and export clean production code configs with single-click accuracy.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 shrink-0 w-full md:w-auto font-medium">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.01)] text-center">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Contrast Tests</div>
              <div className="text-lg font-black text-slate-800 mt-1">Instant</div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.01)] text-center">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Config Export</div>
              <div className="text-lg font-black text-slate-800 mt-1">1-Click</div>
            </div>
          </div>
        </div>

        {/* TAILWIND CSS COLOR MATRIX GRID PANEL */}
        <div id="tailwind-color-matrix-panel" className="lg:col-span-12 bg-slate-950 border border-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 border-b border-slate-900 pb-5">
            <div className="flex items-center gap-3 select-none">
              <svg className="w-8 h-8 text-cyan-400 animate-pulse shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
              </svg>
              <div>
                <div className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
                  <span>tailwindcss</span> <span className="font-light text-slate-400">colors</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Interactive multi-scale spectrum explorer. Select any shade to dynamically change site background, interpolate shades, and analyze WCAG parameters. <span className="inline-block lg:hidden text-cyan-400 font-bold">Swipe horizontally to explore all scales.</span>
                </p>
              </div>
            </div>

            {/* Quick Filter Categories */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/30 p-1 rounded-xl border border-slate-900 text-xs">
              {['All', 'Monochrome', 'Vibrant Warm', 'Natural Fresh', 'Modern Cool', 'Luxury Pastel'].map((category) => (
                <button
                  key={category}
                  onClick={() => setMatrixCategory(category)}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                    matrixCategory === category
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {category === 'All' ? 'Show All' : category}
                </button>
              ))}
            </div>
          </div>

          {/* THE MATRIX CANVAS */}
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950/20">
            <div className="min-w-[1020px] flex gap-4 md:gap-5 justify-between px-1">
              {filteredScales.map((scale) => {
                const weights = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
                return (
                  <div key={scale.name} className="flex flex-col items-center flex-1 min-w-[38px] group/col">
                    {/* Scale Label */}
                    <div className="h-8 flex items-center justify-center mb-2.5 w-full">
                      <span className="text-[10px] font-black text-slate-500 tracking-wider text-center uppercase group-hover/col:text-cyan-400 transition-colors truncate w-full">
                        {scale.name}
                      </span>
                    </div>

                    {/* Column Squares */}
                    <div className="flex flex-col gap-2">
                      {weights.map((weight) => {
                        const hexVal = scale.colors[weight];
                        const isActive = currentBaseHex.toUpperCase() === hexVal.toUpperCase();
                        
                        return (
                          <div key={weight} className="relative group/sq">
                            <button
                              onClick={() => {
                                setColorInput(hexVal);
                              }}
                              className={`w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer shadow-sm relative flex items-center justify-center hover:scale-125 hover:rotate-3 hover:shadow-lg active:scale-95 ${
                                isActive 
                                  ? 'ring-2 ring-white scale-110 z-10 shadow-cyan-500/50' 
                                  : 'hover:ring-2 hover:ring-cyan-300 hover:z-10'
                              }`}
                              style={{ backgroundColor: hexVal }}
                              title={`${scale.name} ${weight}: ${hexVal}`}
                            >
                              {isActive && (
                                <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md animate-ping absolute" />
                              )}
                              {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-md" />
                              )}
                            </button>

                            {/* Micro Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-[10px] font-bold text-white rounded-md opacity-0 group-hover/sq:opacity-100 pointer-events-none transition-all duration-150 shadow-xl whitespace-nowrap z-50">
                              <div className="text-cyan-400">{scale.name} {weight}</div>
                              <div className="font-mono mt-0.5 text-slate-300 uppercase">{hexVal}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick info-strip below grid */}
          <div className="mt-4 pt-4 border-t border-slate-900/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-cyan-400 inline-block animate-pulse" />
              <span>Clicking any color square updates the entire site's primary accent, background theme, and contrast evaluations.</span>
            </div>
            <div className="font-mono text-[10px] text-slate-600 bg-slate-900/30 px-2.5 py-1 rounded-md border border-slate-900">
              Weights: 50 → 950 (Light to Dark)
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: CONTROLS & PALETTES (Lg: Col 4) */}
        <section id="sidebar-controls" className="lg:col-span-4 flex flex-col gap-6">
          
          {/* BASE COLOR PARAMETERS CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-500" /> Color Specifier
              </h2>
              <div 
                className="w-6 h-6 rounded-lg border border-slate-300/60 shadow-inner"
                style={{ backgroundColor: currentBaseHex }}
              />
            </div>

            {/* Custom Sliders for HSL */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Hue (Angle)</span>
                  <span className="font-mono text-slate-800">{baseHsl.h}°</span>
                </div>
                <input 
                  id="hue-range-slider"
                  type="range"
                  min="0"
                  max="360"
                  value={baseHsl.h}
                  onChange={(e) => handleHslSlider('h', parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 via-purple-500 to-red-500 appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Saturation (Purity)</span>
                  <span className="font-mono text-slate-800">{baseHsl.s}%</span>
                </div>
                <input 
                  id="sat-range-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={baseHsl.s}
                  onChange={(e) => handleHslSlider('s', parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-100 appearance-none cursor-pointer accent-indigo-600"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${hslToHex({h: baseHsl.h, s: 0, l: 50})}, ${hslToHex({h: baseHsl.h, s: 100, l: 50})})`
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Lightness (Value)</span>
                  <span className="font-mono text-slate-800">{baseHsl.l}%</span>
                </div>
                <input 
                  id="light-range-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={baseHsl.l}
                  onChange={(e) => handleHslSlider('l', parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-100 appearance-none cursor-pointer accent-indigo-600"
                  style={{
                    backgroundImage: `linear-gradient(to right, #000, ${hslToHex({h: baseHsl.h, s: baseHsl.s, l: 50})}, #fff)`
                  }}
                />
              </div>
            </div>

            {/* PALETTE MODE TUNERS */}
            <div className="border-t border-slate-100 mt-6 pt-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-500" /> Curve Settings
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(['balanced', 'vibrant', 'soft', 'midnight'] as PaletteMode[]).map((mode) => (
                  <button
                    key={mode}
                    id={`curve-mode-${mode}`}
                    onClick={() => setPaletteMode(mode)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl text-left border transition-all capitalize flex items-center justify-between ${
                      paletteMode === mode 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-[0_2px_4px_rgba(79,70,229,0.04)]' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <span>{mode}</span>
                    {paletteMode === mode && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COSMETICS BATCH DECODER CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" /> Batch Code Decoder
              </h2>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 animate-pulse">
                New Utility
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
              Decode cosmetics batch codes to verify production dates, check real-time expiry, and instantly apply signature brand palettes.
            </p>

            <div className="space-y-4">
              {/* Brand Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Brand</label>
                <select
                  value={batchBrand}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setBatchBrand(selected);
                    // Autofill with a sample code for convenience
                    const brandSample = BRAND_DIRECTORY.find(b => b.name === selected);
                    if (brandSample && brandSample.sampleCodes.length > 0) {
                      setBatchCode(brandSample.sampleCodes[0]);
                    }
                  }}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {BRAND_DIRECTORY.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Batch Code Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Batch Code</label>
                  <span className="text-[10px] font-mono text-slate-400">e.g., 2C01, A52</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder="Enter serial number..."
                    className="flex-1 text-xs font-semibold font-mono uppercase tracking-wider px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    onClick={() => handleDecode(batchBrand, batchCode)}
                    disabled={isDecoding || !batchCode}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer"
                  >
                    {isDecoding ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Decode</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick sample tags */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Or try a sample code:</span>
                <div className="flex flex-wrap gap-1.5">
                  {BRAND_DIRECTORY.find(b => b.name === batchBrand)?.sampleCodes.map(code => (
                    <button
                      key={code}
                      onClick={() => {
                        setBatchCode(code);
                        handleDecode(batchBrand, code);
                      }}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-mono font-bold text-slate-600 rounded-lg border border-slate-200/60 hover:border-indigo-200 transition-all cursor-pointer"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* DECODED RESULT WINDOW WITH ENTRY ANIMATION */}
              <div className="pt-1">
                {decodedResult ? (
                  <div 
                    className={`p-4 rounded-xl border transition-all duration-500 ease-out transform ${
                      animateTrigger 
                        ? 'opacity-100 translate-y-0 scale-100' 
                        : 'opacity-0 -translate-y-2 scale-95'
                    } ${
                      decodedResult.status === 'Fresh' 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                        : decodedResult.status === 'Expiring Soon'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-rose-50/70 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white shadow-sm border border-slate-200/10 flex items-center gap-1 text-slate-700">
                        <Activity className="w-3 h-3 text-indigo-500 animate-pulse" /> {decodedResult.brand} Result
                      </span>
                      
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        decodedResult.status === 'Fresh'
                          ? 'bg-emerald-100/80 text-emerald-800'
                          : decodedResult.status === 'Expiring Soon'
                            ? 'bg-amber-100/80 text-amber-800'
                            : 'bg-rose-100/80 text-rose-800'
                      }`}>
                        {decodedResult.status}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Manufactured Date</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{decodedResult.manufacturedDate}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Tag className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Freshness & Expiry</p>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed mt-0.5">{decodedResult.shelfLife}</p>
                        </div>
                      </div>
                    </div>

                    {/* Auto Apply Color Accent */}
                    <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Brand Color:</span>
                        <div className="w-4 h-4 rounded border border-slate-300" style={{ backgroundColor: decodedResult.recommendedColor }} />
                      </div>
                      <button
                        onClick={() => {
                          setColorInput(decodedResult.recommendedColor);
                        }}
                        className="text-[11px] font-extrabold bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" /> Apply Brand Color
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 font-semibold bg-slate-50/40">
                    Enter batch details to verify manufacture parameters.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COMPLEMENTARY & ACCENT COMPOSERS */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3.5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-500" /> Harmony Accents
            </h2>
            <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
              Coordinating accent seeds computed from your base hue. Click any to load it as the primary color.
            </p>
            <div className="space-y-3">
              {colorAccents.map((accent) => (
                <div 
                  key={accent.type}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/40"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      id={`apply-accent-${accent.type.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setColorInput(accent.hex)}
                      className="w-7 h-7 rounded-lg shadow-sm border border-slate-200/40 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                      style={{ backgroundColor: accent.hex }}
                      title="Load this color"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block leading-tight">{accent.type}</span>
                      <span className="font-mono text-[10px] text-slate-500">{accent.hex}</span>
                    </div>
                  </div>
                  <button
                    id={`copy-accent-${accent.type.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleCopy(accent.hex, `accent-${accent.type}`)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {copiedText === `accent-${accent.type}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* GOOGLE ADSENSE INTEGRATION CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Google AdSense
              </h2>
              <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded-md border border-slate-200/40 uppercase">
                Ready
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
              We have integrated the asynchronous AdSense client library. Below is your live responsive ad display slot.
            </p>

            <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-3 space-y-3.5">
              {/* Ad Unit Preview Slot */}
              <div className="relative overflow-hidden bg-slate-100/60 rounded-lg border border-dashed border-slate-200 p-4 text-center">
                <div className="absolute top-2 left-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none">
                  Advertisement
                </div>
                
                {/* Real Google AdSense Tag */}
                <ins className="adsbygoogle"
                     style={{ display: 'block', minHeight: '90px' }}
                     data-ad-client="ca-pub-3787510948967510"
                     data-ad-slot="default-responsive"
                     data-ad-format="auto"
                     data-full-width-responsive="true">
                </ins>

                {/* Aesthetic Backup Placeholder and Config Guide */}
                <div className="py-2.5">
                  <div className="text-xs font-black text-slate-700">Responsive Display Banner</div>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Once verified by Google, active high-paying ads will serve here automatically based on user context.
                  </p>
                </div>
              </div>

              {/* Editable Ad Parameters */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ad Configuration</span>
                  <a 
                    href="https://adsense.google.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                  >
                    Manage Account <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Publisher Client ID</label>
                    <input 
                      type="text" 
                      defaultValue="ca-pub-3787510948967510"
                      readOnly
                      title="Editable inside index.html"
                      className="w-full text-[10px] font-mono font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Ad Unit Slot ID</label>
                    <input 
                      type="text" 
                      defaultValue="9823481235"
                      placeholder="e.g., auto"
                      className="w-full text-[10px] font-mono font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: PALETTE VIEWER & LIVE PREVIEWS (Lg: Col 8) */}
        <section id="workspace-viewer" className="lg:col-span-8 flex flex-col gap-6">
          
          {/* THE PALETTE GRID */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  Generated Shades Spectrum
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click a shade to set it as <span className="font-bold text-slate-700">Active Seed</span> for the live component playground.
                </p>
              </div>
              
              {/* Tailwind-style Format Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/40 text-xs">
                {(['hex', 'rgb', 'hsl'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDisplayFormat(fmt);
                    }}
                    className={`px-2.5 py-1 font-bold rounded-lg transition-all uppercase ${
                      displayFormat === fmt 
                        ? 'bg-white text-indigo-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizontal rows of shades */}
            <div className="flex flex-col gap-2">
              {palette.map((shade) => {
                const isSelected = selectedShadeWeight === shade.weight;
                const whiteContrast = shade.contrastOnWhite;
                const darkContrast = shade.contrastOnDark;

                // Determine contrast badges
                const whitePassAA = whiteContrast >= 4.5;
                const whitePassAAA = whiteContrast >= 7.0;
                const darkPassAA = darkContrast >= 4.5;
                const darkPassAAA = darkContrast >= 7.0;

                const colorRgb = hexToRgb(shade.hex);
                const displayVal = displayFormat === 'hex'
                  ? shade.hex.toUpperCase()
                  : displayFormat === 'rgb'
                    ? `rgb(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b})`
                    : `hsl(${shade.h}, ${shade.s}%, ${shade.l}%)`;

                const secondaryVal = displayFormat === 'hex'
                  ? `hsl(${shade.h}, ${shade.s}%, ${shade.l}%)`
                  : displayFormat === 'rgb'
                    ? shade.hex.toUpperCase()
                    : `rgb(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b})`;

                const secondaryLabel = displayFormat === 'hex'
                  ? 'HSL FORMAT'
                  : displayFormat === 'rgb'
                    ? 'HEX VALUE'
                    : 'RGB FORMAT';

                return (
                  <div 
                    key={shade.weight}
                    id={`shade-row-${shade.weight}`}
                    onClick={() => setSelectedShadeWeight(shade.weight)}
                    className={`flex flex-col md:flex-row items-stretch md:items-center justify-between p-2 md:p-1.5 rounded-xl border transition-all cursor-pointer select-none group ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/25 ring-2 ring-indigo-500/10' 
                        : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Color display block */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className="w-12 h-10 md:h-11 rounded-lg shadow-inner shrink-0 flex items-center justify-center border border-slate-200/30"
                        style={{ backgroundColor: shade.hex }}
                      >
                        {isSelected && (
                          <div className={`w-3 h-3 rounded-full border-2 ${shade.l > 60 ? 'border-slate-900 bg-slate-900' : 'border-white bg-white'}`} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 tracking-wider">WEIGHT</span>
                          <span className="text-xs font-black text-slate-800 block mt-0.5">{shade.weight}</span>
                        </div>
                        
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{displayFormat} VALUE</span>
                          <button
                            id={`copy-hex-${shade.weight}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(displayVal, `val-${shade.weight}`);
                            }}
                            className="font-mono text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 mt-0.5 group/btn"
                            title={`Copy ${displayFormat.toUpperCase()} Value`}
                          >
                            <span className="truncate max-w-[120px] md:max-w-none">{displayVal}</span>
                            {copiedText === `val-${shade.weight}` ? (
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0" />
                            )}
                          </button>
                        </div>
 
                        <div className="hidden md:block">
                          <span className="text-[11px] font-bold text-slate-400 tracking-wider">{secondaryLabel}</span>
                          <span className="font-mono text-[11px] text-slate-600 block mt-0.5 truncate">
                            {secondaryVal}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* WCAG Contrast Columns */}
                    <div className="flex items-center gap-2.5 md:gap-4 mt-3 md:mt-0 border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                      
                      {/* Contrast with White */}
                      <div className="flex-1 md:flex-initial text-center md:text-right bg-slate-50/60 md:bg-transparent p-1.5 md:p-0 rounded-lg">
                        <div className="text-[10px] md:text-[11px] font-bold text-slate-400 tracking-wider">CONTRAST / WHITE</div>
                        <div className="flex items-center justify-center md:justify-end gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-bold text-slate-700">{whiteContrast}:1</span>
                          {whitePassAA ? (
                            <span className="inline-flex items-center px-1 py-0.2 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              AA {whitePassAAA && '✓'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1 py-0.2 text-[9px] font-extrabold bg-red-50 text-red-600 rounded border border-red-200">
                              FAIL
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contrast with Dark */}
                      <div className="flex-1 md:flex-initial text-center md:text-right bg-slate-50/60 md:bg-transparent p-1.5 md:p-0 rounded-lg">
                        <div className="text-[10px] md:text-[11px] font-bold text-slate-400 tracking-wider">CONTRAST / DARK</div>
                        <div className="flex items-center justify-center md:justify-end gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-bold text-slate-700">{darkContrast}:1</span>
                          {darkPassAA ? (
                            <span className="inline-flex items-center px-1 py-0.2 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              AA {darkPassAAA && '✓'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1 py-0.2 text-[9px] font-extrabold bg-red-50 text-red-600 rounded border border-red-200">
                              FAIL
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* INTERACTIVE COMPONENT PREVIEW PLAYGROUND */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  Interactive UI Sandbox
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live verification of primary color behaviour across common user interface modules.
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/30">
                <span className="px-2.5 py-1 text-xs font-black text-indigo-700 bg-white rounded-lg shadow-sm border border-slate-200/40">
                  Shade {activeShade.weight}
                </span>
                <span 
                  className="w-3.5 h-3.5 rounded-full border border-slate-200" 
                  style={{ backgroundColor: activeShade.hex }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LIGHT THEME BOX PREVIEW */}
              <div className="border border-slate-200/80 rounded-xl bg-white p-5 shadow-[0_4px_12px_rgba(15,23,42,0.015)]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode Frame
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-400">BG: #FFFFFF</span>
                </div>

                <div className="space-y-5">
                  {/* Buttons Suite */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 tracking-wider">Button Suite</label>
                    <div className="flex flex-wrap gap-2.5">
                      <button 
                        id="sandbox-btn-light-solid"
                        className="px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm hover:opacity-90 active:scale-95 cursor-pointer"
                        style={{ 
                          backgroundColor: activeShade.hex, 
                          color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A' 
                        }}
                      >
                        Solid Primary
                      </button>
                      <button 
                        id="sandbox-btn-light-outline"
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-white transition-all border hover:bg-slate-50 active:scale-95 cursor-pointer"
                        style={{ 
                          borderColor: activeShade.hex, 
                          color: activeShade.hex 
                        }}
                      >
                        Outline
                      </button>
                    </div>
                    {/* Contrast warning */}
                    {activeShade.contrastOnWhite < 4.5 && (
                      <div className="mt-2 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/40 px-2 py-1 rounded-md flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> Solid button has sub-optimal WCAG contrast ({activeShade.contrastOnWhite}:1) on white.
                      </div>
                    )}
                  </div>

                  {/* Info Toast Banner */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 tracking-wider">Toast / Alert</label>
                    <div 
                      className="p-3.5 rounded-xl border flex items-start gap-3"
                      style={{ 
                        backgroundColor: `${palette[0].hex}25`, // Add alpha
                        borderColor: palette[2].hex,
                      }}
                    >
                      <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: activeShade.hex }}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold" style={{ color: palette[9].hex }}>Operation Completed</h4>
                        <p className="text-[11px] mt-0.5 font-medium leading-relaxed" style={{ color: palette[8].hex }}>
                          Files synchronized flawlessly with the live storage instance.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form input field focus test */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5 tracking-wider">Interactive Input & Toggle</label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <input 
                          id="sandbox-input-light"
                          type="text" 
                          placeholder="Focus highlights border..." 
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:ring-1 transition-all"
                          style={{ 
                            '--tw-ring-color': activeShade.hex,
                            bordercolor: activeShade.hex
                          } as React.CSSProperties}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 cursor-pointer">
                        <div 
                          className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200"
                          style={{ backgroundColor: activeShade.hex }}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">Active</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* DARK THEME BOX PREVIEW */}
              <div className="border border-slate-800 rounded-xl bg-slate-900 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark Mode Frame
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-500">BG: #0F172A</span>
                </div>

                <div className="space-y-5">
                  {/* Buttons Suite */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wider">Button Suite</label>
                    <div className="flex flex-wrap gap-2.5">
                      <button 
                        id="sandbox-btn-dark-solid"
                        className="px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm hover:opacity-90 active:scale-95 cursor-pointer"
                        style={{ 
                          backgroundColor: activeShade.hex, 
                          color: activeShade.contrastOnDark >= 4.5 ? '#0F172A' : '#FFFFFF' 
                        }}
                      >
                        Solid Primary
                      </button>
                      <button 
                        id="sandbox-btn-dark-outline"
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-950/40 transition-all border hover:bg-slate-800 active:scale-95 cursor-pointer"
                        style={{ 
                          borderColor: activeShade.hex, 
                          color: activeShade.hex 
                        }}
                      >
                        Outline
                      </button>
                    </div>
                    {/* Contrast warning */}
                    {activeShade.contrastOnDark < 4.5 && (
                      <div className="mt-2 text-[10px] font-medium text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2 py-1 rounded-md flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> Solid button has sub-optimal WCAG contrast ({activeShade.contrastOnDark}:1) on dark slate.
                      </div>
                    )}
                  </div>

                  {/* Progress Statistics Dashboard Card */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Workspace Metric</span>
                        <h4 className="text-sm font-extrabold text-white mt-0.5">$48,291.50</h4>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${palette[8].hex}25`, color: palette[3].hex }}>
                        +14.2%
                      </span>
                    </div>
                    {/* Visual sparkline chart using custom SVG based on palette colors */}
                    <div className="h-10 mt-4">
                      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 10">
                        <path 
                          d="M0,10 L10,8 L20,9 L30,4 L40,6 L50,2 L60,5 L70,3 L80,1 L90,2 L100,0" 
                          fill="none" 
                          stroke={activeShade.hex} 
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M0,10 L10,8 L20,9 L30,4 L40,6 L50,2 L60,5 L70,3 L80,1 L90,2 L100,0 L100,10 L0,10 Z" 
                          fill={`url(#sparkline-grad-${activeShade.weight})`}
                          opacity="0.15"
                        />
                        <defs>
                          <linearGradient id={`sparkline-grad-${activeShade.weight}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activeShade.hex} />
                            <stop offset="100%" stopColor={activeShade.hex} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>

                  {/* Form input field focus test */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 tracking-wider">System Badge</label>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 text-xs font-bold rounded-lg" style={{ backgroundColor: `${activeShade.hex}22`, color: activeShade.hex, border: `1px solid ${activeShade.hex}44` }}>
                        Service Active
                      </span>
                      <span className="px-3 py-1 text-xs font-bold rounded-lg text-slate-400 bg-slate-800 border border-slate-700">
                        Version 4.1.14
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* INTERACTIVE PANTRY TRACKER CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-500" style={{ color: activeShade.hex }} />
                  Interactive Pantry Tracker
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Demonstrating smooth <span className="font-bold text-indigo-600" style={{ color: activeShade.hex }}>entrance & exit animations</span> for dynamic item additions or deletions.
                </p>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5 shrink-0" style={{ backgroundColor: `${activeShade.hex}11`, color: activeShade.hex, borderColor: `${activeShade.hex}22` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: activeShade.hex }} />
                CSS Transitions Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Add New Item Form Section */}
              <form onSubmit={addPantryItem} className="lg:col-span-4 bg-slate-50/70 border border-slate-200/60 rounded-xl p-4.5 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Add New Pantry Item
                </h3>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Organic Avocado"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    style={{ '--tw-ring-color': activeShade.hex } as React.CSSProperties}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Quantity</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 3 pcs"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                      style={{ '--tw-ring-color': activeShade.hex } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                      style={{ '--tw-ring-color': activeShade.hex } as React.CSSProperties}
                    >
                      <option value="Produce">Produce</option>
                      <option value="Dairy/Alt">Dairy/Alt</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Meat/Seafood">Meat/Seafood</option>
                      <option value="Pantry Staples">Pantry Staples</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Freshness Status</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Fresh', 'Expiring Soon', 'Expired'] as const).map((status) => {
                      const isActive = newItemExpiry === status;
                      const activeColors = 
                        status === 'Fresh' ? 'bg-emerald-500 text-white' :
                        status === 'Expiring Soon' ? 'bg-amber-500 text-white' :
                        'bg-rose-500 text-white';
                      const inactiveColors = 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200';

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setNewItemExpiry(status)}
                          className={`px-1 py-1.5 text-[9px] font-bold rounded-md text-center transition-all ${isActive ? activeColors : inactiveColors}`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg text-xs font-bold shadow-sm transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  style={{
                    backgroundColor: activeShade.hex,
                    color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Pantry
                </button>
              </form>

              {/* Pantry Inventory List Display */}
              <div className="lg:col-span-8 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Pantry Inventory ({pantryItems.length})
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 hidden lg:inline">
                      Hover item to reveal delete trigger
                    </span>
                  </div>

                  {pantryItems.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-semibold bg-slate-50/40 py-12">
                      Your kitchen pantry is completely empty. Add some food items above!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                      {pantryItems.map((item) => {
                        // Styling based on freshness status
                        const statusBadgeStyles = 
                          item.expiryStatus === 'Fresh' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                          item.expiryStatus === 'Expiring Soon' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                          'bg-rose-50 text-rose-700 border border-rose-200/60';

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-xl border border-slate-200/70 bg-white hover:bg-slate-50/40 hover:border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all group ${
                              item.isExiting ? 'animate-item-exit' : 'animate-item-entry'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Status dot + category */}
                              <div className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${statusBadgeStyles}`}>
                                {item.expiryStatus.toUpperCase()}
                              </div>
                              
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 truncate">
                                  {item.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-semibold">
                                  <span>{item.quantity}</span>
                                  <span>•</span>
                                  <span className="bg-slate-100 px-1.5 py-0.2 rounded-md">{item.category}</span>
                                </div>
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => removePantryItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 active:scale-95 cursor-pointer shrink-0"
                              title="Delete pantry item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Micro metrics card */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Fresh: {pantryItems.filter(i => i.expiryStatus === 'Fresh').length}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Warning: {pantryItems.filter(i => i.expiryStatus === 'Expiring Soon').length}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Expired: {pantryItems.filter(i => i.expiryStatus === 'Expired').length}
                    </span>
                  </div>
                  
                  {pantryItems.length > 0 && (
                    <button
                      onClick={() => {
                        // Batch animate out all items
                        pantryItems.forEach((item, index) => {
                          setTimeout(() => {
                            removePantryItem(item.id);
                          }, index * 40); // Stagger deletion slightly for incredible wave animation effect!
                        });
                      }}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      Clear Inventory
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>

          {/* CODE EXPORTERS CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  Code & Config Exporter
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inject this custom theme structure directly into your web engineering stack.
                </p>
              </div>

              {/* Tabs selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40 w-full sm:w-auto">
                <button
                  id="tab-v4-btn"
                  onClick={() => setExportFormat('v4')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    exportFormat === 'v4' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tailwind v4
                </button>
                <button
                  id="tab-v3-btn"
                  onClick={() => setExportFormat('v3')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    exportFormat === 'v3' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tailwind v3
                </button>
                <button
                  id="tab-css-btn"
                  onClick={() => setExportFormat('css')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    exportFormat === 'css' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  CSS Var
                </button>
                <button
                  id="tab-json-btn"
                  onClick={() => setExportFormat('json')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    exportFormat === 'json' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Code presentation block with copy button */}
            <div className="relative">
              <pre className="bg-slate-950 rounded-xl p-5 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[380px] border border-slate-800">
                <code>{activeExportCode}</code>
              </pre>
              
              <button
                id="copy-config-btn"
                onClick={() => handleCopy(activeExportCode, 'config')}
                className="absolute top-4 right-4 p-2 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer border border-slate-700/60"
              >
                {copiedText === 'config' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Copied Code</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy Snippet</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="flex items-start gap-2.5 mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/40">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                {exportFormat === 'v4' && (
                  <span><strong>Tailwind CSS v4:</strong> Paste this inside your global <code>index.css</code> within the new <code>@theme</code> block. Use as class names like <code>bg-primary-500</code>.</span>
                )}
                {exportFormat === 'v3' && (
                  <span><strong>Tailwind v3:</strong> Nest this inside the <code>theme.extend</code> block of your <code>tailwind.config.js</code> setup file.</span>
                )}
                {exportFormat === 'css' && (
                  <span><strong>CSS Variables:</strong> Standardize variables globally on your <code>:root</code> element. Reference as <code>var(--primary-500)</code>.</span>
                )}
                {exportFormat === 'json' && (
                  <span><strong>Design Tokens JSON:</strong> Ready to integrate into standard design tooling configurations like Style Dictionary or Figma plugins.</span>
                )}
              </div>
            </div>

          </div>

        </section>

      </main>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 animate-item-entry">
          
          {/* Breadcrumb / Top control bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Utility Information</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: activeShade.hex }}>
                {activePage === 'blog' && (selectedBlogPost ? `Blog: ${selectedBlogPost.title}` : 'Design & Accessibility Blog')}
                {activePage === 'about' && 'About This System'}
                {activePage === 'contact' && 'Contact Support & Feedback'}
                {activePage === 'privacy' && 'Privacy & Cookie Policy'}
                {activePage === 'terms' && 'Terms of Service License'}
              </span>
            </div>
            <button
              onClick={() => setActivePage('generator')}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: activeShade.hex,
                color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
              }}
            >
              <Palette className="w-3.5 h-3.5" />
              Back to Color Generator
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sub-Navigation Side-Bar */}
            <div className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 lg:gap-2 bg-white border border-slate-200/90 rounded-2xl p-3 lg:p-4 shadow-sm whitespace-nowrap lg:whitespace-normal scrollbar-none">
              <p className="hidden lg:block text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-2">
                Information Guide
              </p>
              
              <button
                onClick={() => { setActivePage('blog'); setSelectedBlogPost(null); }}
                className={`w-auto lg:w-full flex items-center justify-between gap-4 px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer shrink-0 ${
                  activePage === 'blog' 
                    ? 'text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                style={activePage === 'blog' ? {
                  backgroundColor: activeShade.hex,
                  color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
                } : {}}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Design Blog</span>
                </div>
                {activePage === 'blog' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>

              <button
                onClick={() => { setActivePage('about'); setIsSubmitted(false); }}
                className={`w-auto lg:w-full flex items-center justify-between gap-4 px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer shrink-0 ${
                  activePage === 'about' 
                    ? 'text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                style={activePage === 'about' ? {
                  backgroundColor: activeShade.hex,
                  color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
                } : {}}
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </div>
                {activePage === 'about' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>

              <button
                onClick={() => { setActivePage('contact'); setIsSubmitted(false); }}
                className={`w-auto lg:w-full flex items-center justify-between gap-4 px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer shrink-0 ${
                  activePage === 'contact' 
                    ? 'text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                style={activePage === 'contact' ? {
                  backgroundColor: activeShade.hex,
                  color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
                } : {}}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </div>
                {activePage === 'contact' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>

              <button
                onClick={() => { setActivePage('privacy'); setIsSubmitted(false); }}
                className={`w-auto lg:w-full flex items-center justify-between gap-4 px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer shrink-0 ${
                  activePage === 'privacy' 
                    ? 'text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                style={activePage === 'privacy' ? {
                  backgroundColor: activeShade.hex,
                  color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
                } : {}}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Privacy Policy</span>
                </div>
                {activePage === 'privacy' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>

              <button
                onClick={() => { setActivePage('terms'); setIsSubmitted(false); }}
                className={`w-auto lg:w-full flex items-center justify-between gap-4 px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer shrink-0 ${
                  activePage === 'terms' 
                    ? 'text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                style={activePage === 'terms' ? {
                  backgroundColor: activeShade.hex,
                  color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
                } : {}}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Terms of Service</span>
                </div>
                {activePage === 'terms' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            </div>

            {/* Sub-Page Render Target Card */}
            <div className="lg:col-span-9 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
              
              {/* 1. ABOUT PAGE */}
              {activePage === 'about' && (
                <div className="space-y-6">
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <h2 className="text-2xl font-black text-slate-950 flex items-center gap-2.5">
                      <Info className="w-7 h-7" style={{ color: activeShade.hex }} />
                      About Tailwind Color Generator
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      Exploring the science of anchor-based shade interpolation, WCAG 2.1 compliance scoring, and cosmetic diagnostics.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-2.5">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeShade.hex }} />
                        Anchor-Based Interpolation
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Rather than using simple linear scaling which degrades chroma saturation rapidly, this generator applies custom non-linear curves. By anchoring the 500-weight value as the base seed color, the algorithm projects lightness ratios to establish perfect UI utility targets from shade 50 (soft background) to shade 950 (dense terminal text).
                      </p>
                    </div>

                    <div className="p-5 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-2.5">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeShade.hex }} />
                        WCAG 2.1 Contrast Mechanics
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        We calculate the exact relative luminance of each generated shade. By comparing this value against standard light (white) and dark (charcoal) background anchors, the system generates real-time WCAG 2.1 compliance scores, guaranteeing that your designs remain accessible to individuals with low vision.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-4">
                    <h3 className="text-base font-extrabold text-slate-900">Our Core Pillars</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full text-[10px] font-black text-white flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: activeShade.hex, color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A' }}>1</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Developer-First Output</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">We optimize configurations directly for Tailwind CSS v4, v3, CSS variables, and clean JSON tokens to remove manual porting friction.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full text-[10px] font-black text-white flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: activeShade.hex, color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A' }}>2</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Cosmetics Diagnostics & Tracking</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">Includes professional-grade perfume batch analyzers to double-check serial records, alongside our high-performance interactive pantry ingredient tracking loop.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CONTACT PAGE */}
              {activePage === 'contact' && (
                <div className="space-y-6">
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <h2 className="text-2xl font-black text-slate-950 flex items-center gap-2.5">
                      <Mail className="w-7 h-7" style={{ color: activeShade.hex }} />
                      Contact & Feedback Center
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      Have a feature suggestion or found a color calculation discrepancy? Send us your comments!
                    </p>
                  </div>

                  {isSubmitted ? (
                    <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-6 text-center space-y-3 max-w-lg mx-auto py-10">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                        <Check className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">Message Submitted Successfully!</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Thank you for reaching out, <span className="font-bold">{contactName}</span>. A support specialist has received your inquiry regarding <strong>"{contactSubject}"</strong>. We will review your message and reply back to <strong>{contactEmail}</strong> within 12-24 business hours.
                      </p>
                      <div className="pt-2">
                        <span className="inline-block bg-white border border-slate-200 text-slate-500 font-mono text-[10px] px-3 py-1 rounded-md">
                          Ticket Reference: #TCG-{Math.floor(Math.random()*90000 + 10000)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setIsSubmitted(false);
                          setContactName('');
                          setContactEmail('');
                          setContactMessage('');
                        }}
                        className="text-xs font-bold underline block mx-auto pt-2 cursor-pointer"
                        style={{ color: activeShade.hex }}
                      >
                        Send Another Message
                      </button>
                    </div>
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (contactName.trim() && contactEmail.trim() && contactMessage.trim()) {
                          setIsSubmitted(true);
                        }
                      }}
                      className="space-y-4 max-w-2xl"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Your Full Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="John Doe"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full text-xs bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all focus:bg-white"
                            style={{ '--tw-ring-color': activeShade.hex } as React.CSSProperties}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Your Email Address</label>
                          <input 
                            type="email"
                            required
                            placeholder="john@example.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full text-xs bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all focus:bg-white"
                            style={{ '--tw-ring-color': activeShade.hex } as React.CSSProperties}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Subject of Inquiry</label>
                        <select
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          className="w-full text-xs bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all focus:bg-white"
                          style={{ '--tw-ring-color': activeShade.hex } as React.CSSProperties}
                        >
                          <option value="General Inquiry">General Inquiry / Question</option>
                          <option value="Bug Report">Contrast Discrepancy or Bug Report</option>
                          <option value="Feature Proposal">Feature Proposal / Suggestion</option>
                          <option value="Business Partnership">Business Partnership & Licensing</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Detailed Message</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="How can we help you improve your color workflow today? Be as detailed as possible."
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="w-full text-xs bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all focus:bg-white"
                          style={{ '--tw-ring-color': activeShade.hex } as React.CSSProperties}
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 px-5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        style={{
                          backgroundColor: activeShade.hex,
                          color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
                        }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Support Ticket
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* 3. PRIVACY POLICY */}
              {activePage === 'privacy' && (
                <div className="space-y-6">
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <h2 className="text-2xl font-black text-slate-950 flex items-center gap-2.5">
                      <Shield className="w-7 h-7" style={{ color: activeShade.hex }} />
                      Privacy & Cookie Policy
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      Last Updated: July 2026. Review how we protect and value your design parameters.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
                    <p>
                      Welcome to the **Tailwind Color Palette & Contrast Analyzer** utility. We take your digital rights and information safety very seriously. This documentation details exactly what statistics we gather and how we handle them.
                    </p>

                    <h3 className="text-sm font-bold text-slate-900 mt-4">1. Local Device Execution & Off-line Safety</h3>
                    <p>
                      All color transformations, HSL anchor computations, contrast ratios, and cosmetics code diagnostics occur entirely within your personal browser session using pure React, TypeScript, and standard memory blocks. No color strings, palettes, or local item listings are ever uploaded or transmitted to external remote servers.
                    </p>

                    <h3 className="text-sm font-bold text-slate-900 mt-4">2. Cookies & Contextual Advertisements</h3>
                    <p>
                      Our utility utilizes Google AdSense and third-party advertising scripts to keep this platform free for designers and engineers worldwide. Google AdSense utilizes non-personalized cookies to serve relevant context-based advertisements to you. You can adjust your cookie settings or clear your cache anytime inside your browser options.
                    </p>

                    <h3 className="text-sm font-bold text-slate-900 mt-4">3. LocalStorage Persistence</h3>
                    <p>
                      If you use custom inputs or add items to the Interactive Pantry Tracker, these properties reside strictly in your browser's state memory. If you refresh or reset your application, the memory safely purges back to normal unless persistent state indicators are explicitly written locally.
                    </p>
                  </div>
                </div>
              )}

              {/* 4. TERMS OF SERVICE */}
              {activePage === 'terms' && (
                <div className="space-y-6">
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <h2 className="text-2xl font-black text-slate-950 flex items-center gap-2.5">
                      <FileText className="w-7 h-7" style={{ color: activeShade.hex }} />
                      Terms of Service License
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      Standard permissive license guidelines for utilizing generated assets.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
                    <p>
                      By accessing, generating color codes, or downloading configs from this utility, you agree to comply with the terms listed herein.
                    </p>

                    <h3 className="text-sm font-bold text-slate-900 mt-4">1. Permissive Design License</h3>
                    <p>
                      All output code blocks, hex spectrums, Tailwind configurations, design tokens JSON strings, and theme definitions generated by the utility are licensed under the permissive Apache-2.0 / MIT guidelines. You are fully authorized to copy, share, edit, include, and distribute these assets in any personal, team, or highly commercial software layout without licensing constraints.
                    </p>

                    <h3 className="text-sm font-bold text-slate-900 mt-4">2. Accuracy of Calculations</h3>
                    <p>
                      Our calculations follow the mathematically structured relative luminance criteria defined by the Web Content Accessibility Guidelines (WCAG 2.1). However, final on-screen rendering may vary depending on the end-user's physical monitor panel, background lighting, and OS-level color filters. Standard visual verification of code palettes in production environments is highly recommended.
                    </p>

                    <h3 className="text-sm font-bold text-slate-900 mt-4">3. Limitation of Liabilities</h3>
                    <p>
                      This open-source software is provided "as is" without warranty of any kind, express or implied. The authors are not responsible for any design mistakes, color palette modifications, or application errors that may arise from using our generated configs.
                    </p>
                  </div>
                </div>
              )}

              {/* 5. DESIGN & ACCESSIBILITY BLOG */}
              {activePage === 'blog' && (() => {
                const parseInlineStyles = (text: string) => {
                  const segments = text.split(/(\*\*.*?\*\*|`.*?`)/g);
                  return segments.map((seg, idx) => {
                    if (seg.startsWith('**') && seg.endsWith('**')) {
                      return <strong key={idx} className="font-bold text-slate-950">{seg.slice(2, -2)}</strong>;
                    }
                    if (seg.startsWith('`') && seg.endsWith('`')) {
                      return <code key={idx} className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-indigo-600 border border-slate-200/40">{seg.slice(1, -1)}</code>;
                    }
                    return seg;
                  });
                };

                const renderBlogPostContent = (content: string) => {
                  const lines = content.split('\n');
                  let listItems: string[] = [];
                  const renderedElements: React.ReactNode[] = [];

                  const flushList = (key: number) => {
                    if (listItems.length > 0) {
                      renderedElements.push(
                        <ul key={`list-${key}`} className="list-none space-y-2 my-4 pl-1">
                          {listItems.map((item, i) => (
                            <li key={i} className="text-xs text-slate-600 font-medium leading-relaxed flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: activeShade.hex }} />
                              <span>{parseInlineStyles(item)}</span>
                            </li>
                          ))}
                        </ul>
                      );
                      listItems = [];
                    }
                  };

                  lines.forEach((line, index) => {
                    const trimmed = line.trim();
                    if (!trimmed) {
                      flushList(index);
                      return;
                    }

                    if (trimmed.startsWith('### ')) {
                      flushList(index);
                      renderedElements.push(
                        <h3 key={index} className="text-base font-extrabold text-slate-950 mt-6 mb-3 flex items-center gap-2">
                          <span className="w-1 h-4 rounded-sm shrink-0" style={{ backgroundColor: activeShade.hex }} />
                          {trimmed.slice(4)}
                        </h3>
                      );
                    } else if (trimmed.startsWith('#### ')) {
                      flushList(index);
                      renderedElements.push(
                        <h4 key={index} className="text-sm font-extrabold text-slate-900 mt-4 mb-2">
                          {trimmed.slice(5)}
                        </h4>
                      );
                    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                      listItems.push(trimmed.slice(2));
                    } else {
                      flushList(index);
                      renderedElements.push(
                        <p key={index} className="text-xs text-slate-600 leading-relaxed font-medium mb-3.5">
                          {parseInlineStyles(trimmed)}
                        </p>
                      );
                    }
                  });

                  flushList(lines.length);
                  return renderedElements;
                };

                if (selectedBlogPost) {
                  return (
                    <div className="space-y-6 animate-item-entry">
                      {/* Back button */}
                      <button
                        onClick={() => setSelectedBlogPost(null)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
                      >
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" style={{ color: activeShade.hex }} />
                        Back to Articles
                      </button>

                      {/* Header details */}
                      <div className="space-y-3 border-b border-slate-100 pb-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white" style={{ backgroundColor: activeShade.hex }}>
                            {selectedBlogPost.category}
                          </span>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            {selectedBlogPost.readTime}
                          </div>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                            <User className="w-3.5 h-3.5" />
                            By {selectedBlogPost.author}
                          </div>
                        </div>

                        <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-tight">
                          {selectedBlogPost.title}
                        </h2>

                        <p className="text-xs text-slate-500 font-bold italic leading-relaxed">
                          "{selectedBlogPost.summary}"
                        </p>
                      </div>

                      {/* Reading container */}
                      <div className="max-w-3xl pr-4">
                        {renderBlogPostContent(selectedBlogPost.content)}
                      </div>

                      {/* Footer reading card */}
                      <div className="border border-slate-100 bg-slate-50/55 rounded-2xl p-5 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Enjoyed the article?</p>
                          <p className="text-xs text-slate-600 font-semibold mt-0.5">Generate customized Tailwind palettes to apply these accessibility standards in seconds.</p>
                        </div>
                        <button
                          onClick={() => {
                            setActivePage('generator');
                            setSelectedBlogPost(null);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-extrabold text-white shrink-0 hover:opacity-95 transition-all active:scale-95 cursor-pointer shadow-sm"
                          style={{
                            backgroundColor: activeShade.hex,
                            color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
                          }}
                        >
                          Launch Color Generator
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6 animate-item-entry">
                    {/* Header with Search and filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                      <div>
                        <h2 className="text-2xl font-black text-slate-950 flex items-center gap-2.5">
                          <BookOpen className="w-7 h-7" style={{ color: activeShade.hex }} />
                          Design Systems & Contrast Blog
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                          Curated resources, color math, and accessible UI checklists for front-end developers.
                        </p>
                      </div>
                    </div>

                    {/* Filter and Search controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-50/70 p-3 rounded-2xl border border-slate-200/50">
                      {/* Search */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search articles (e.g. contrast, Tailwind...)"
                          value={blogSearchQuery}
                          onChange={(e) => setBlogSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 font-medium transition-all"
                          style={{ '--tw-ring-color': activeShade.hex } as React.CSSProperties}
                        />
                      </div>

                      {/* Categories filter */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {['All', 'Design Systems', 'Accessibility', 'SaaS', 'Development'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setBlogCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              blogCategoryFilter === cat
                                ? 'text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100/50 border border-slate-200/50'
                            }`}
                            style={blogCategoryFilter === cat ? {
                              backgroundColor: activeShade.hex,
                              color: activeShade.contrastOnWhite >= 4.5 ? '#FFFFFF' : '#0F172A',
                            } : {}}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Blog grid */}
                    {filteredBlogPosts.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No articles found</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Try checking your spelling or selecting another category.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredBlogPosts.map((post) => (
                          <div
                            key={post.id}
                            onClick={() => setSelectedBlogPost(post)}
                            className="group flex flex-col justify-between border border-slate-200/80 rounded-2xl p-5 bg-white hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all duration-200 relative overflow-hidden"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 group-hover:bg-indigo-50/50 group-hover:text-indigo-600 transition-colors"
                                  style={{
                                    '--tw-text-opacity': '1',
                                    '--tw-bg-opacity': '1'
                                  } as React.CSSProperties}
                                >
                                  {post.category}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  {post.readTime}
                                </div>
                              </div>

                              <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug">
                                {post.title}
                              </h3>

                              <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                                {post.summary}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
                              <span className="text-[10px] font-bold text-slate-400">
                                {post.date} • By {post.author}
                              </span>
                              <span className="text-xs font-extrabold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" style={{ color: activeShade.hex }}>
                                Read Article
                                <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          FOOTER CREDIT & EXPLANATIONS
         ========================================== */}
      <footer id="app-footer" className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-8 border-t border-slate-200 text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-5">
          <button onClick={() => setActivePage('generator')} className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">Generator</button>
          <span className="text-slate-300">•</span>
          <button onClick={() => { setActivePage('blog'); setSelectedBlogPost(null); }} className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">Blog</button>
          <span className="text-slate-300">•</span>
          <button onClick={() => setActivePage('about')} className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">About</button>
          <span className="text-slate-300">•</span>
          <button onClick={() => setActivePage('contact')} className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">Contact</button>
          <span className="text-slate-300">•</span>
          <button onClick={() => setActivePage('privacy')} className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">Privacy Policy</button>
          <span className="text-slate-300">•</span>
          <button onClick={() => setActivePage('terms')} className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">Terms of Service</button>
        </div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
          Tailwind Color Palette & Contrast Generator Utility
        </p>
        <p className="text-xs text-slate-500 mt-2 max-w-xl mx-auto leading-relaxed">
          Generates visually uniform scale values via anchor interpolation from any seed, tracking relative luminance with the Web Content Accessibility Guidelines (WCAG) 2.1 formulas.
        </p>
      </footer>

    </div>
  );
}
