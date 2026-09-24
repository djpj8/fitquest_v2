import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function calcBMI(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Sottopeso', color: 'hsl(200 70% 55%)' };
  if (bmi < 25) return { label: 'Normopeso ✓', color: 'hsl(160 60% 50%)' };
  if (bmi < 30) return { label: 'Sovrappeso', color: 'hsl(43 85% 55%)' };
  return { label: 'Obesità', color: 'hsl(0 70% 55%)' };
}

export const CATEGORY_COLORS: Record<string, string> = {
  chest: 'hsl(0 70% 55%)', back: 'hsl(200 70% 55%)', legs: 'hsl(130 60% 50%)',
  shoulders: 'hsl(280 60% 60%)', arms: 'hsl(30 80% 55%)', core: 'hsl(43 85% 55%)', cardio: 'hsl(160 70% 50%)',
};

export const CATEGORY_ICONS: Record<string, string> = {
  chest: '💪', back: '🦅', legs: '🦵', shoulders: '🔱', arms: '💪', core: '🎯', cardio: '🔥',
};

export const STATIC_EXERCISES = new Set([
  'plank', 'side plank', 'hollow body hold', 'l-sit', 'pike hold',
  'wall handstand', 'handstand', 'front lever', 'back lever', 'planche', 'human flag', 'dead hang',
]);

export const isStatic = (name: string) => STATIC_EXERCISES.has(name.toLowerCase());
