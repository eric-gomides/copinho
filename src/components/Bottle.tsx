import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  ClipPath,
  Defs,
  Rect,
  Ellipse,
  G,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { SHADES, BOTTLE_SHAPES, type BottleColorId, type BottleShapeId } from '../theme/colorShades';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';

// ─── Animated SVG components (defined at module level) ──
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// ─── SVG viewBox constants ──────────────────────────────
const VB_W = 100;
const VB_H = 150;

export type BottleVariant = 'mascot' | 'minimal' | 'arcade';
export type BottleMood = 'sad' | 'ok' | 'happy' | 'ecstatic';

interface BottleProps {
  pct?: number;
  variant?: BottleVariant;
  color?: BottleColorId;
  shape?: BottleShapeId;
  width?: number;
  height?: number;
  goalMl?: number;
  currentMl?: number;
  showBubbles?: boolean;
  showLabel?: boolean;
}

function getMood(pct: number): BottleMood {
  if (pct < 0.2) return 'sad';
  if (pct < 0.6) return 'ok';
  if (pct < 1) return 'happy';
  return 'ecstatic';
}

export function Bottle({
  pct = 0.5,
  variant = 'mascot',
  color = 'aqua',
  shape = 'classic',
  width = 240,
  height = 340,
  goalMl = 4000,
  currentMl = 0,
  showBubbles = true,
  showLabel = true,
}: BottleProps) {
  const clampedPct = Math.max(0, Math.min(1, pct));
  const mood = getMood(clampedPct);
  const SH = BOTTLE_SHAPES[shape] ?? BOTTLE_SHAPES.classic;
  const C = SHADES[color] ?? SHADES.aqua;
  // Unique IDs per Bottle instance — prevents SVG defs collisions when
  // multiple Bottles render simultaneously (e.g., shape picker grid).
  const clipId = `bc-${shape}-${Math.round(width)}-${color}`;
  const gradId = `wg-${shape}-${Math.round(width)}-${color}`;

  // ── Animated fill level ────────────────────────────────
  const fillRatio = useSharedValue(clampedPct);
  useEffect(() => {
    fillRatio.value = withTiming(clampedPct, {
      duration: 800,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
  }, [clampedPct]);

  // ── Water rect animated props ──────────────────────────
  const waterAnimProps = useAnimatedProps(() => {
    const fillH = fillRatio.value * VB_H;
    return { y: VB_H - fillH, height: fillH };
  });

  // ── Wobble surface ellipse ─────────────────────────────
  const wobble = useSharedValue(0);
  useEffect(() => {
    wobble.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const ellipseAnimProps = useAnimatedProps(() => {
    const fillH = fillRatio.value * VB_H;
    return {
      cy: VB_H - fillH,
      rx: interpolate(wobble.value, [0, 1], [VB_W * 0.5, VB_W * 0.58]),
      ry: interpolate(wobble.value, [0, 1], [2.5, 4.2]),
    };
  });

  const showEllipse = clampedPct > 0.02 && clampedPct < 0.98;
  const highFill = clampedPct > 0.55;
  const labelColor = highFill ? '#ffffff' : C.cap;

  // Cap dimensions from shape definition
  const capDef = SH.cap;
  const capWidth    = capDef ? width * capDef.width  : 0;
  const capRingWidth = capDef ? width * capDef.ringW : 0;
  const capHeight   = capDef ? (capDef.height / 340) * height : 0;
  const capRingHeight = capDef ? (capDef.ring / 340) * height : 0;

  return (
    <View style={{ width, height }}>
      {/* ── Cap (hidden for cup shape) ────────────────── */}
      {capDef && (
        <>
          <View
            style={{
              position: 'absolute',
              width: capWidth,
              height: capHeight,
              left: (width - capWidth) / 2,
              top: capDef.top,
              backgroundColor: C.cap,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              zIndex: 3,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: capRingWidth,
              height: capRingHeight,
              left: (width - capRingWidth) / 2,
              top: capHeight - 2,
              backgroundColor: C.capRing,
              borderRadius: 3,
              zIndex: 3,
            }}
          />
        </>
      )}

      {/* ── Bottle SVG ────────────────────────────────── */}
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <ClipPath id={clipId}>
            <Path d={SH.path} />
          </ClipPath>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.waterTop} />
            <Stop offset="1" stopColor={C.waterMid} />
          </LinearGradient>
        </Defs>

        <G clipPath={`url(#${clipId})`}>
          {/* Glass base */}
          <Rect x={0} y={0} width={VB_W} height={VB_H} fill={C.glassTint} />

          {/* Water */}
          <AnimatedRect
            animatedProps={waterAnimProps}
            x={0}
            width={VB_W}
            fill={variant === 'arcade' ? C.waterMid : `url(#${gradId})`}
          />

          {/* Surface wobble */}
          {showEllipse && (
            <AnimatedEllipse
              animatedProps={ellipseAnimProps}
              cx={VB_W / 2}
              fill={C.waterArc}
            />
          )}

          {/* Highlight stripe */}
          {variant !== 'arcade' && (
            <Rect x={20} y={42} width={3} height={VB_H - 72} fill="#ffffff" fillOpacity={0.35} rx={1.5} />
          )}
        </G>

        {/* Outline */}
        {variant !== 'arcade' && (
          <Path d={SH.path} fill="none" stroke={C.glassStroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        )}

      </Svg>

      {/* ── Bubbles ───────────────────────────────────── */}
      {showBubbles && clampedPct > 0.15 && <Bubbles width={width} height={height} />}

      {/* ── Face ──────────────────────────────────────── */}
      {variant === 'mascot' && (
        <BottleFace mood={mood} width={width} height={height} fillPct={clampedPct} facePosPct={SH.facePos} eyeColor={C.cap} />
      )}

      {/* ── ml / goal label (RN Text — fora do SVG para não distorcer) ── */}
      {showLabel && (
        <View style={styles.labelWrapper} pointerEvents="none">
          <Text style={[styles.label, { color: labelColor }]}>
            {(currentMl / 1000).toFixed(2)}L / {(goalMl / 1000).toFixed(1)}L
          </Text>
        </View>
      )}

      {/* ── Arcade % ───────────────────────────────────── */}
      {variant === 'arcade' && (
        <View style={[styles.labelWrapper, { bottom: undefined, top: height * 0.35 }]} pointerEvents="none">
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 2 }}>
            {Math.round(clampedPct * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Bubbles ────────────────────────────────────────────

const AnimBubble = Animated.createAnimatedComponent(View);

const BUBBLES = [
  { size: 5, bottomPct: 0.12, leftPct: 0.38, delay: 0,    dur: 3200 },
  { size: 7, bottomPct: 0.24, leftPct: 0.55, delay: 900,  dur: 4100 },
  { size: 5, bottomPct: 0.33, leftPct: 0.44, delay: 1700, dur: 3700 },
  { size: 6, bottomPct: 0.19, leftPct: 0.62, delay: 2300, dur: 4500 },
];

function Bubbles({ width, height }: { width: number; height: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }] as any}>
      {BUBBLES.map((b, i) => (
        <BubbleItem key={i} {...b} width={width} height={height} />
      ))}
    </View>
  );
}

function BubbleItem({
  size, bottomPct, leftPct, delay, dur, width, height,
}: (typeof BUBBLES)[0] & { width: number; height: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      progress.value = withRepeat(
        withTiming(1, { duration: dur, easing: Easing.in(Easing.ease) }),
        -1
      );
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.25, 0.8, 1], [0, 0.7, 0.45, 0]),
  }));

  return (
    <AnimBubble
      style={[animStyle, {
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255,255,255,0.55)',
        bottom: bottomPct * height,
        left: leftPct * width,
      }]}
    />
  );
}

// ─── Mascot face ────────────────────────────────────────

function BottleFace({
  mood, width, height, fillPct, facePosPct, eyeColor: eyeColorProp,
}: { mood: BottleMood; width: number; height: number; fillPct: number; facePosPct: number; eyeColor: string }) {
  const highFill = fillPct > 0.55;
  const eyeColor = highFill ? '#ffffff' : eyeColorProp;
  // faceTop: use shape's facePos when water is high, otherwise slightly above it
  const faceTop = (fillPct > 0.45 ? facePosPct : facePosPct - 0.10) * height;

  // Blink via useAnimatedStyle (proper Reanimated pattern)
  const blinkScale = useSharedValue(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    function scheduleBlink() {
      if (!active) return;
      timeoutRef.current = setTimeout(() => {
        blinkScale.value = withTiming(0.08, { duration: 60 }, () => {
          blinkScale.value = withTiming(1, { duration: 80 });
        });
        scheduleBlink();
      }, 4000 + Math.random() * 2000);
    }
    scheduleBlink();
    return () => {
      active = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const eyeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blinkScale.value }],
  }));

  const eyeBase = { width: 9, height: 11, borderRadius: 5.5, backgroundColor: eyeColor };
  const cheekOffset = 20;

  return (
    <View
      style={{
        position: 'absolute',
        top: faceTop,
        left: 0,
        right: 0,
        alignItems: 'center',
        pointerEvents: 'none',
      } as any}
    >
      {/* Eyes */}
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
        <Animated.View style={[eyeBase, eyeAnimStyle]} />
        <Animated.View style={[eyeBase, eyeAnimStyle]} />
      </View>

      {/* Mouth */}
      <View style={{ marginTop: 10, alignItems: 'center', position: 'relative' }}>
        {mood === 'sad' && (
          <View
            style={{
              width: 18,
              height: 9,
              borderWidth: 2.5,
              borderColor: eyeColor,
              borderBottomWidth: 0,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
            }}
          />
        )}
        {mood === 'ok' && (
          <View style={{ width: 20, height: 2.5, backgroundColor: eyeColor, borderRadius: 2 }} />
        )}
        {mood === 'happy' && (
          <View
            style={{
              width: 24,
              height: 12,
              borderWidth: 2.5,
              borderColor: eyeColor,
              borderTopWidth: 0,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
            }}
          />
        )}
        {mood === 'ecstatic' && (
          <View
            style={{
              width: 28,
              height: 16,
              backgroundColor: eyeColor,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                alignSelf: 'center',
                width: 12,
                height: 5,
                backgroundColor: '#f58b6b',
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
              }}
            />
          </View>
        )}

        {/* Cheeks */}
        {(mood === 'happy' || mood === 'ecstatic') && (
          <>
            <View
              style={{
                position: 'absolute',
                left: -cheekOffset,
                top: 3,
                width: 10,
                height: 6,
                backgroundColor: '#f58b6b',
                borderRadius: 5,
                opacity: 0.7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: -cheekOffset,
                top: 3,
                width: 10,
                height: 6,
                backgroundColor: '#f58b6b',
                borderRadius: 5,
                opacity: 0.7,
              }}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cap: { position: 'absolute', zIndex: 3 },
  labelWrapper: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
