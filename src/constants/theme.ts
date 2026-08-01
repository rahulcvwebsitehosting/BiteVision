/**
 * The single source of truth for colour, type, space, shape and motion.
 *
 * Nothing outside this file should contain a hex value, a font family string, or
 * an off-scale spacing number. `npm run typecheck` will not catch a stray `#fff`,
 * so the rule is enforced by review — see README, "Design system".
 */

export const color = {
  /** App background. Near-white, cool-neutral. */
  ground: '#FAFAF9',
  /** Cards, sheets, list rows. */
  surface: '#FFFFFF',
  /** Primary type and primary buttons. Near-black, neutral. */
  ink: '#141414',
  /** Secondary type, captions, units, timestamps. */
  muted: '#8B8B87',
  /** Hairlines at 1px. Used sparingly. */
  line: '#E6E6E2',
  /** Protein. */
  paprika: '#B0553A',
  /** Carbs. */
  wheat: '#A9822B',
  /** Fat. */
  olive: '#5E7A3C',
} as const;

export type ColorToken = keyof typeof color;

/**
 * Colours used only behind the live camera and its full-bleed overlays. These
 * are the one context where the light ground would fight the viewfinder, so a
 * true black backdrop and ink-tinted scrims are used instead — kept here so no
 * component carries a raw hex value.
 */
export const camera = {
  backdrop: '#000000',
  /** Circular control buttons over the viewfinder. */
  controlScrim: 'rgba(20, 20, 20, 0.5)',
  /** "Preparing your photo" cover on the capture screen. */
  overlayScrim: 'rgba(20, 20, 20, 0.55)',
  /** "Reading your plate" cover on the review screen. */
  analyzingScrim: 'rgba(20, 20, 20, 0.6)',
} as const;

/** The three macro colours are the entire chromatic system. */
export const macroColor = {
  protein: color.paprika,
  carbs: color.wheat,
  fat: color.olive,
} as const;

/** One sans family, two weights, throughout. */
export const font = {
  /** Display numerals and titles. */
  display: 'Archivo_600SemiBold',
  displayMedium: 'Archivo_500Medium',
  /** Everything else. */
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
} as const;

/**
 * Type roles. Tracking is expressed in points, already
 * resolved from the percentages in the spec at each size.
 */
export const type = {
  hero: {
    fontFamily: font.display,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.2,
  },
  mealCalories: {
    fontFamily: font.displayMedium,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  screenTitle: {
    fontFamily: font.semibold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.36,
  },
  sectionLabel: {
    fontFamily: font.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  rowTitle: {
    fontFamily: font.medium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  button: {
    fontFamily: font.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
  },
} as const;

export type TypeRole = keyof typeof type;

/** Applied to every number that updates in place. Non-negotiable. */
export const tabularNums = {
  fontVariant: ['tabular-nums'] as ('tabular-nums')[],
};

/** `position: absolute` filling the parent. Spreadable, unlike `absoluteFill`. */
export const fillParent = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

/** Spacing scale. Nothing off-scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const layout = {
  screenGutter: 20,
  cardPadding: space.base,
  minRowHeight: 64,
  minTouchTarget: 44,
  dayRailHeight: 72,
} as const;

export const radius = {
  /** Inputs and chips. */
  input: 8,
  /** Cards and sheets. */
  card: 12,
  /** The FAB, and nothing else. */
  full: 999,
} as const;

/**
 * Flat surfaces — no shadows anywhere. Cards separate themselves from the
 * ground with a hairline instead.
 */
export const elevation = {
  shadowColor: color.ink,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
} as const;

export const duration = {
  /** Every transition that is not the save sequence. */
  quick: 180,
  /** The new Day Rail segment scaling in. */
  segment: 400,
  /** The hero figure counting to its new value. */
  count: 600,
  /** Ceiling when Reduce Motion is on. */
  reduced: 160,
} as const;

/** Translate distance for the standard 180ms enter transition. */
export const motionOffset = 4;

export const opacity = {
  /** Going over target renders in ink at reduced opacity, never in red. */
  over: 0.55,
  disabled: 0.4,
  pressed: 0.7,
} as const;
