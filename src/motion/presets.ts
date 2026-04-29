import type { Variants } from 'motion/react';

export const ease = {
  water: [0.22, 0.61, 0.36, 1] as const,
  drop: [0.5, 0, 0.75, 0] as const,
  emerge: [0.16, 1.0, 0.3, 1] as const,
  vanish: [0.4, 0, 1, 1] as const,
};

export const dur = {
  instant: 0.12,
  fast: 0.24,
  medium: 0.48,
  slow: 0.9,
  cinematic: 1.8,
};

export const glyphFall: Variants = {
  initial: { y: -60, opacity: 0 },
  drop: {
    y: 60,
    opacity: 1,
    transition: { duration: dur.fast, ease: ease.drop as any },
  },
  splash: {
    opacity: 0,
    transition: { duration: dur.fast, ease: ease.vanish as any },
  },
};

export const cardEmerge: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.medium, ease: ease.emerge as any },
  },
  fading: {
    opacity: 0,
    transition: { duration: dur.slow, ease: ease.vanish as any },
  },
};

export const compoundBloom: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  bloom: {
    opacity: 1,
    scale: [0.85, 1.05, 1],
    transition: { duration: dur.medium, ease: ease.emerge as any },
  },
};

export const cursorPulse: Variants = {
  pulse: {
    scale: [0.95, 1.04, 0.95],
    opacity: [0.35, 0.6, 0.35],
    transition: { duration: 1.6, repeat: Infinity, ease: ease.water as any },
  },
};

export const inputFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: dur.cinematic, ease: ease.water as any, delay: 4.5 },
  },
};

export const titleFloat: Variants = {
  float: {
    y: [-0.5, 0.5, -0.5],
    transition: { duration: 6, repeat: Infinity, ease: ease.water as any },
  },
};
