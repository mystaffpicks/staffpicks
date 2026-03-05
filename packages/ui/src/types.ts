/**
 * Shared UI prop types used across web and mobile components.
 */

export type ColorToken = keyof typeof import('./tokens.js').colors;

export interface BaseCardProps {
  onPress?: () => void;
  testID?: string;
}

export interface ContentCardProps extends BaseCardProps {
  title: string;
  posterUrl?: string | null;
  platform?: string | null;
  year?: number | null;
  rating?: number | null;
  take?: string | null;
}
