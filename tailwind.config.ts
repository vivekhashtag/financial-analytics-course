import type { Config } from 'tailwindcss';
import tokens from './schema/tokens.json';

/**
 * Tailwind is configured *from* schema/tokens.json — the design tokens are the
 * single source of truth, so a token change propagates to every utility class.
 */
const LINE_HEIGHTS: Record<string, string> = {
  xs: '1.5', sm: '1.55', base: '1.7', lg: '1.65',
  xl: '1.4', '2xl': '1.3', '3xl': '1.2', '4xl': '1.1',
};

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    // Part accents are referenced by name from module.json, so keep them safelisted.
  ],
  safelist: [
    { pattern: /^(bg|text|border|ring|from|to)-part-(A|B|C|D|capstone|appendix)$/ },
  ],
  theme: {
    extend: {
      colors: {
        bg: tokens.color.bg,
        surface: tokens.color.surface,
        'surface-alt': tokens.color.surfaceAlt,
        border: tokens.color.border,
        ink: tokens.color.text,
        muted: tokens.color.textMuted,
        primary: {
          DEFAULT: tokens.color.primary,
          hover: tokens.color.primaryHover,
          fg: tokens.color.primaryFg,
        },
        part: tokens.color.part,
        success: tokens.color.semantic.success,
        warn: tokens.color.semantic.warn,
        danger: tokens.color.semantic.danger,
        info: tokens.color.semantic.info,
      },
      // Three families, sourced from schema/tokens.json. The families resolve
      // through CSS variables that next/font sets in app/layout.tsx, so the
      // actual font files stay self-hosted and Tailwind stays the only place
      // class names are defined.
      fontFamily: {
        heading: [tokens.font.heading], // Sora 600/700 — h1–h4, module headers
        body: [tokens.font.body], //      Inter 400/500/600 — prose, UI, numbers
        mono: [tokens.font.mono], //      JetBrains Mono 400/500 — all code
        // `font-sans` kept as an alias for body so existing usages still read
        // as "the UI face" rather than silently falling back to system-ui.
        sans: [tokens.font.body],
      },
      fontSize: {
        ...Object.fromEntries(
          Object.entries(tokens.font.scale).map(([k, v]) => [
            k,
            [v as string, { lineHeight: LINE_HEIGHTS[k] ?? '1.6' }] as [
              string,
              { lineHeight: string },
            ],
          ]),
        ),
        // Long-form reading only — `text-base` stays 1rem for UI chrome.
        prose: [tokens.font.prose.size, { lineHeight: tokens.font.prose.lineHeight }] as [
          string,
          { lineHeight: string },
        ],
        'prose-lead': [tokens.font.prose.lead, { lineHeight: '1.6' }] as [
          string,
          { lineHeight: string },
        ],
        'prose-code': [tokens.font.prose.code, { lineHeight: '1.7' }] as [
          string,
          { lineHeight: string },
        ],
      },
      borderRadius: tokens.radius,
      boxShadow: {
        sm: tokens.shadow.sm,
        card: tokens.shadow.card,
        lift: tokens.shadow.lift,
      },
      spacing: tokens.space,
      maxWidth: {
        content: tokens.layout.contentMaxWidth,
        wide: tokens.layout.wideMaxWidth,
      },
      width: { sidebar: tokens.layout.sidebarWidth },
      transitionDuration: {
        fast: tokens.motion.fast,
        base: tokens.motion.base,
        slow: tokens.motion.slow,
      },
      transitionTimingFunction: { token: tokens.motion.ease },
      // Every keyframe here is transform/opacity only, so nothing triggers
      // layout and nothing costs a frame. Durations stay under 1.5s; the only
      // infinite animations are the two "breathing" ones, used at most twice
      // per page (see docs/UI-SPEC.md § motion budget).
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // one-time spring for a badge being earned
        'spring-pop': {
          '0%': { opacity: '0', transform: 'scale(.7)' },
          '55%': { opacity: '1', transform: 'scale(1.12)' },
          '75%': { transform: 'scale(.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // ≤300ms confirmation flash on a correct answer
        'pulse-correct': {
          '0%': { boxShadow: '0 0 0 0 rgba(22,163,74,.45)' },
          '70%': { boxShadow: '0 0 0 8px rgba(22,163,74,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(22,163,74,0)' },
        },
        // quiz explanation / feedback opening
        'slide-open': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // breathing: the learner's current station on the metro map
        halo: {
          '0%, 100%': { opacity: '.35', transform: 'scale(1)' },
          '50%': { opacity: '.75', transform: 'scale(1.35)' },
        },
        // breathing: order-book bars
        breathe: {
          '0%, 100%': { transform: 'scaleX(1)' },
          '50%': { transform: 'scaleX(.86)' },
        },
        // pulse travelling along the data-pipeline diagram
        'flow-dash': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-28' },
        },
      },
      animation: {
        'fade-up': `fade-up ${tokens.motion.base} ${tokens.motion.ease} both`,
        'pop-in': `pop-in ${tokens.motion.fast} ${tokens.motion.ease} both`,
        'spring-pop': 'spring-pop 620ms cubic-bezier(.34,1.56,.64,1) both',
        'pulse-correct': 'pulse-correct 300ms ease-out 1',
        'slide-open': `slide-open ${tokens.motion.base} ${tokens.motion.ease} both`,
        halo: 'halo 2600ms ease-in-out infinite',
        breathe: 'breathe 2800ms ease-in-out infinite',
        'flow-dash': 'flow-dash 1400ms linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
