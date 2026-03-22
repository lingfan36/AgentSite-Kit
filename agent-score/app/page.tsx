'use client';

import { useState } from 'react';

interface CheckItem {
  id: string;
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details: string;
  suggestion: string;
}

interface CheckResult {
  url: string;
  items: CheckItem[];
  totalScore: number;
  responseTimeMs: number;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#1f2937" strokeWidth={stroke} />
        <circle
          cx="90" cy="90" r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-bold" style={{ color }}>{score}</span>
        <span className="text-sm text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function GradeLabel({ score }: { score: number }) {
  if (score >= 70) return <span className="text-green-400 font-semibold text-lg">Agent-Friendly</span>;
  if (score >= 40) return <span className="text-yellow-400 font-semibold text-lg">Needs Improvement</span>;
  return <span className="text-red-400 font-semibold text-lg">Not Agent-Ready</span>;
}

function CheckItemCard({ item }: { item: CheckItem }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex gap-4 items-start">
      <div className="mt-0.5 text-xl shrink-0">
        {item.passed ? '✅' : '❌'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-gray-100">{item.name}</h3>
          <span className="text-sm text-gray-400 shrink-0">{item.score}/{item.maxScore}</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">{item.details}</p>
        {!item.passed && item.suggestion && (
          <p className="text-sm text-yellow-300/80 mt-2">💡 {item.suggestion}</p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState('');

  async function handleCheck() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Agent<span className="text-blue-400">Score</span>
        </h1>
        <p className="text-gray-400 text-lg">How Agent-friendly is your website?</p>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
          placeholder="Enter a URL, e.g. docs.github.com"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          disabled={loading}
        />
        <button
          onClick={handleCheck}
          disabled={loading || !url.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-6 py-3 rounded-lg transition-colors shrink-0"
        >
          {loading ? 'Checking…' : 'Check'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Analyzing {url}…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-center">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {/* Score */}
          <div className="text-center space-y-3">
            <ScoreRing score={result.totalScore} />
            <div><GradeLabel score={result.totalScore} /></div>
            <p className="text-sm text-gray-500">
              Checked {result.url} in {result.responseTimeMs}ms
            </p>
          </div>

          {/* Items */}
          <div className="space-y-3">
            {result.items.map(item => (
              <CheckItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-800/50 rounded-lg p-6 text-center">
            <p className="text-gray-200 mb-3">Fix these issues automatically</p>
            <a
              href="https://github.com/lingfan36/AgentSite-Kit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Get AgentSite Kit →
            </a>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
        Built with{' '}
        <a href="https://github.com/lingfan36/AgentSite-Kit" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          AgentSite Kit
        </a>
      </footer>
    </main>
  );
}
