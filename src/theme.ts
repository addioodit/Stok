export const theme = {
  colors: {
    bg: '#FFFFFF',
    surface: '#F7F8FA',
    surfaceAlt: '#EEF1F6',
    border: '#E5E7EB',
    text: '#0B0F19',
    textSecondary: '#6B7280',
    textInverse: '#FFFFFF',
    primary: '#1F6FEB',
    primaryPressed: '#1858BD',
    positive: '#16A34A',
    negative: '#DC2626',
    warn: '#D97706',
  },
  spacing: (n: number) => n * 8,
  radius: { sm: 6, md: 10, lg: 14 },
  font: {
    h1: 24,
    h2: 20,
    body: 16,
    small: 14,
    tiny: 12,
  },
};

export type Theme = typeof theme;
