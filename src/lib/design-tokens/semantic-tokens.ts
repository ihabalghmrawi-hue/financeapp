export const semanticColors = {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: {
    bg: 'hsl(var(--card))',
    fg: 'hsl(var(--card-foreground))',
    border: 'hsl(var(--border))',
  },
  primary: {
    bg: 'hsl(var(--primary))',
    fg: 'hsl(var(--primary-foreground))',
    muted: 'hsl(var(--primary) / 0.1)',
    glow: 'rgba(29, 185, 84, 0.15)',
  },
  secondary: {
    bg: 'hsl(var(--secondary))',
    fg: 'hsl(var(--secondary-foreground))',
  },
  muted: {
    bg: 'hsl(var(--muted))',
    fg: 'hsl(var(--muted-foreground))',
  },
  accent: {
    bg: 'hsl(var(--accent))',
    fg: 'hsl(var(--accent-foreground))',
  },
  destructive: {
    bg: 'hsl(var(--destructive))',
    fg: 'hsl(var(--destructive-foreground))',
    muted: 'hsl(var(--destructive) / 0.1)',
  },
  success: {
    bg: 'hsl(var(--success))',
    fg: 'hsl(var(--success-foreground))',
    muted: 'hsl(var(--success) / 0.1)',
  },
  warning: {
    bg: 'hsl(var(--warning))',
    fg: 'hsl(var(--warning-foreground))',
    muted: 'hsl(var(--warning) / 0.1)',
  },
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  popover: {
    bg: 'hsl(var(--popover))',
    fg: 'hsl(var(--popover-foreground))',
  },
  spotify: {
    green: '#1DB954',
    black: '#191414',
    darkBg: '#121212',
    lightBg: '#282828',
    lighterBg: '#3E3E3E',
    white: '#FFFFFF',
    gray: {
      100: '#B3B3B3',
      200: '#727272',
      300: '#535353',
    },
  },
} as const

export const chartColors = {
  revenue: 'hsl(141, 73%, 42%)',
  expense: 'hsl(0, 84%, 60%)',
  profit: 'hsl(221, 83%, 53%)',
  primary: 'hsl(141, 73%, 42%)',
  blue: 'hsl(221, 83%, 53%)',
  red: 'hsl(0, 84%, 60%)',
  amber: 'hsl(38, 92%, 50%)',
  purple: 'hsl(263, 90%, 51%)',
  teal: 'hsl(173, 80%, 40%)',
  pink: 'hsl(340, 82%, 52%)',
  revenueArea: 'rgba(16, 185, 129, 0.15)',
  expenseArea: 'rgba(239, 68, 68, 0.15)',
  profitArea: 'rgba(59, 130, 246, 0.15)',
} as const

export const semanticScale = {
  radius: {
    input: 'calc(var(--radius) - 2px)',
    card: 'var(--radius)',
    dialog: 'var(--radius)',
    button: '0.75rem',
    badge: '9999px',
  },
  space: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    section: '1.5rem',
    cardPadding: '1.5rem',
    cardGap: '1rem',
  },
  elevation: {
    flat: 'var(--elevation-1)',
    raised: 'var(--elevation-2)',
    overlay: 'var(--elevation-3)',
    modal: 'var(--elevation-4)',
  },
} as const
