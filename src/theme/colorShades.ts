// Bottle color presets and shape definitions.
// Hex values computed from handoff's colorShades() formula via oklch→hex (Node script).
// Single source of truth for Bottle.tsx and PersonalizeScreen.tsx.

export type BottleColorId =
  | 'aqua' | 'ocean' | 'grape' | 'rose'
  | 'coral' | 'tangerine' | 'lime' | 'forest';

export type BottleShapeId = 'classic' | 'gallon' | 'cup';

export interface ColorShade {
  hue: number;
  cap: string;        // darkest — cap, text on light fill, eye color
  capRing: string;    // cap ring
  waterMid: string;   // main water fill
  waterTop: string;   // gradient top of water
  waterArc: string;   // surface wobble ellipse
  glassTint: string;  // glass background tint
  glassEdge: string;  // glass highlight
  bg50: string;       // screen/card background tint
  glassStroke: string;// outline stroke
}

// Pre-computed from oklch(L C H) for 8 hues × 9 shades.
// aqua matches the app's existing teal palette by design (same hue family).
export const SHADES: Record<BottleColorId, ColorShade> = {
  aqua:      { hue: 195, cap: '#003e3f', capRing: '#006768', waterMid: '#009d9e', waterTop: '#00b7b7', waterArc: '#008585', glassTint: '#e7faf9', glassEdge: '#b2e2e2', bg50: '#cdf4f3', glassStroke: '#96d1d0' },
  ocean:     { hue: 235, cap: '#003855', capRing: '#005d89', waterMid: '#0891c9', waterTop: '#37aae3', waterArc: '#177ba8', glassTint: '#e9f8ff', glassEdge: '#b9def4', bg50: '#d2f0ff', glassStroke: '#9fcbe6' },
  grape:     { hue: 295, cap: '#362957', capRing: '#5a478b', waterMid: '#8c74cc', waterTop: '#a58de6', waterArc: '#7763ab', glassTint: '#f6f3ff', glassEdge: '#d9d2f6', bg50: '#ede6ff', glassStroke: '#c6bde8' },
  rose:      { hue: 345, cap: '#4e203c', capRing: '#7e3963', waterMid: '#bc6398', waterTop: '#d77cb1', waterArc: '#9e5580', glassTint: '#fff0f8', glassEdge: '#f1cbdf', bg50: '#ffe1f1', glassStroke: '#e2b5cd' },
  coral:     { hue:  25, cap: '#551f1d', capRing: '#883835', waterMid: '#c8635d', waterTop: '#e47c75', waterArc: '#a85550', glassTint: '#fff0ee', glassEdge: '#f7cbc7', bg50: '#ffe2de', glassStroke: '#e9b6b1' },
  tangerine: { hue:  55, cap: '#512500', capRing: '#824103', waterMid: '#c16e2d', waterTop: '#dc8748', waterArc: '#a25e2b', glassTint: '#fff2e9', glassEdge: '#f3d0b9', bg50: '#ffe5d2', glassStroke: '#e4bba0' },
  lime:      { hue: 125, cap: '#2a3900', capRing: '#475f06', waterMid: '#749331', waterTop: '#8cac4b', waterArc: '#637c2d', glassTint: '#f2f8e9', glassEdge: '#d0deba', bg50: '#e5f0d4', glassStroke: '#bbcba1' },
  forest:    { hue: 155, cap: '#003e20', capRing: '#036639', waterMid: '#349d62', waterTop: '#51b67a', waterArc: '#318454', glassTint: '#ebf9ef', glassEdge: '#bee2c9', bg50: '#d7f4e0', glassStroke: '#a6d0b3' },
};

export interface BottleColorDef {
  id: BottleColorId;
  name: string;
}

export const BOTTLE_COLORS: BottleColorDef[] = [
  { id: 'aqua',      name: 'Aqua'      },
  { id: 'ocean',     name: 'Oceano'    },
  { id: 'grape',     name: 'Uva'       },
  { id: 'rose',      name: 'Rosa'      },
  { id: 'coral',     name: 'Coral'     },
  { id: 'tangerine', name: 'Tangerina' },
  { id: 'lime',      name: 'Limão'     },
  { id: 'forest',    name: 'Floresta'  },
];

export interface BottleShapeDef {
  label: string;
  path: string;
  cap: { width: number; height: number; ring: number; ringW: number; top: number } | null;
  facePos: number; // vertical position of face as fraction of total height
}

export const BOTTLE_SHAPES: Record<BottleShapeId, BottleShapeDef> = {
  classic: {
    label: 'Garrafa',
    path: 'M 30 12 Q 30 5 38 5 L 62 5 Q 70 5 70 12 L 70 20 Q 70 28 78 38 Q 90 52 90 75 L 90 135 Q 90 145 78 145 L 22 145 Q 10 145 10 135 L 10 75 Q 10 52 22 38 Q 30 28 30 20 Z',
    cap: { width: 0.36, height: 22, ring: 10, ringW: 0.42, top: 0 },
    facePos: 0.48,
  },
  gallon: {
    label: 'Garrafão',
    path: 'M 38 8 Q 38 3 44 3 L 56 3 Q 62 3 62 8 L 62 16 Q 62 20 64 22 L 80 27 Q 92 32 92 48 L 92 138 Q 92 145 85 145 L 15 145 Q 8 145 8 138 L 8 48 Q 8 32 20 27 L 36 22 Q 38 20 38 16 Z',
    cap: { width: 0.28, height: 16, ring: 6, ringW: 0.34, top: 0 },
    facePos: 0.50,
  },
  cup: {
    label: 'Copo',
    path: 'M 14 14 Q 14 8 22 8 L 78 8 Q 86 8 86 14 L 88 138 Q 88 145 80 145 L 20 145 Q 12 145 12 138 Z',
    cap: null, // cups have no screw cap
    facePos: 0.52,
  },
};
