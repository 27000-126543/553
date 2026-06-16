import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(value: number, fraction = 1): string {
  return `${value.toFixed(fraction)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

export function getYChangePercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function heatLevelToColor(level: 1 | 2 | 3 | 4 | 5): string {
  const colors = ['#00FFA3', '#8CFF00', '#FFD700', '#FF8C00', '#FF3B5C'];
  return colors[level - 1];
}

export function occupancyToHeatLevel(occupancy: number): 1 | 2 | 3 | 4 | 5 {
  if (occupancy < 30) return 1;
  if (occupancy < 50) return 2;
  if (occupancy < 70) return 3;
  if (occupancy < 85) return 4;
  return 5;
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
