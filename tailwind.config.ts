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
      fontFamily: {
        sans: [tokens.font.sans],
        mono: [tokens.font.mono],
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
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': `fade-up ${tokens.motion.base} ${tokens.motion.ease} both`,
        'pop-in': `pop-in ${tokens.motion.fast} ${tokens.motion.ease} both`,
      },
    },
  },
  plugins: [],
};

export default config;
