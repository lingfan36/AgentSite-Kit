import type { CheckResult } from './checker';

export interface ScoreGrade {
  label: string;
  color: string;
  emoji: string;
}

export function getGrade(score: number): ScoreGrade {
  if (score >= 70) return { label: 'Agent-Friendly', color: '#22c55e', emoji: '🟢' };
  if (score >= 40) return { label: 'Needs Improvement', color: '#eab308', emoji: '🟡' };
  return { label: 'Not Agent-Ready', color: '#ef4444', emoji: '🔴' };
}

export function getSuggestions(result: CheckResult): string[] {
  return result.items
    .filter(item => !item.passed && item.suggestion)
    .sort((a, b) => b.maxScore - a.maxScore)
    .map(item => item.suggestion);
}
