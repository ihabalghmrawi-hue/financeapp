export const animationDuration = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.4,
  slowest: 0.5,
  page: 0.35,
  stagger: 0.05,
} as const

export const animationEasing = {
  default: [0.25, 0.1, 0.25, 1] as const,
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  springSnappy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  springGentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
  easeOut: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.76, 0, 0.24, 1] as const,
  linear: [0, 0, 1, 1] as const,
}

export const motionVariants = {
  fadeIn: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: animationDuration.page, ease: animationEasing.default },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: animationDuration.slower, ease: animationEasing.easeOut },
  },
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: animationDuration.normal, ease: animationEasing.easeOut },
  },
  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: animationDuration.slow, ease: animationEasing.easeOut },
  },
  scaleHover: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: animationDuration.fast, ease: animationEasing.default },
  },
  cardHover: {
    whileHover: {
      y: -2,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
    },
    transition: { duration: animationDuration.normal, ease: animationEasing.easeOut },
  },
  stagger: {
    visible: { transition: { staggerChildren: animationDuration.stagger } },
  },
  staggerItem: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: animationDuration.normal, ease: animationEasing.default } },
  },
  counter: {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: animationDuration.slower, delay: i * 0.08, ease: animationEasing.easeOut },
    }),
  },
  glowPulse: {
    animate: {
      boxShadow: ['0 0 20px rgba(29,185,84,0.1)', '0 0 40px rgba(29,185,84,0.2)', '0 0 20px rgba(29,185,84,0.1)'],
    },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  buttonPress: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.97 },
    transition: { duration: animationDuration.fast },
  },
  liftHover: {
    whileHover: { y: -2, transition: { duration: animationDuration.fast } },
  },
} as const

export const hapticPresets = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  selection: 'selection',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const
