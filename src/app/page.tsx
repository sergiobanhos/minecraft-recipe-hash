'use client';

import { useState } from 'react';
import Image from 'next/image';

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEMS = [
  'none', 'wood', 'stone', 'iron', 'gold', 'diamond',
  'netherite', 'stick', 'cobblestone', 'coal',
];

const ITEM_ASSET: Record<string, string> = {
  wood: '/minecraft-assets/wood.webp',
  stone: '/minecraft-assets/stone.webp',
  iron: '/minecraft-assets/iron.webp',
  gold: '/minecraft-assets/gold.webp',
  diamond: '/minecraft-assets/diamond.webp',
  netherite: '/minecraft-assets/netherite.png',
  stick: '/minecraft-assets/stick.webp',
  cobblestone: '/minecraft-assets/cobblestone.png',
  coal: '/minecraft-assets/coal.webp',
};

const RESULT_EMOJI: Record<string, string> = {
  'wood-sword': '🗡️', 'stone-sword': '🗡️', 'iron-sword': '⚔️',
  'gold-sword': '⚔️', 'diamond-sword': '⚔️', 'netherite-sword': '⚔️',
  'wood-pickaxe': '⛏️', 'stone-pickaxe': '⛏️', 'iron-pickaxe': '⛏️',
  'gold-pickaxe': '⛏️', 'diamond-pickaxe': '⛏️', 'netherite-pickaxe': '⛏️',
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type IndexStats = {
  totalRegistros: number;
  totalPaginas: number;
  totalBuckets: number;
  tempoConstrucaoMs: string;
  taxaColisao: string;
  taxaOverflow: string;
  colisoes: number;
  overflows: number;
};

type CraftResult = {
  encontrado: boolean;
  itemCraftado?: string;
  chaveBusca: string;
  bucketAcessado: number | null;
  indice: { custo: number; tempo: number };
  scan: { custo: number; tempo: number };
  stats: IndexStats;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function CraftingSlot({ index, value, onChange }: {
  index: number; value: string; onChange: (v: string) => void;
}) {
  const assetSrc = ITEM_ASSET[value];
  return (
    <div className="relative w-full aspect-square flex items-center justify-center">
      {assetSrc && (
        <Image src={assetSrc} alt={value} fill
          className="pixel-art object-contain p-[6px] pointer-events-none select-none" />
      )}
      <select id={`slot-${index}`} value={value} onChange={e => onChange(e.target.value)}
        className="mc-slot-select opacity-0" title={value}>
        {ITEMS.map(it => <option key={it} value={it}>{it}</option>)}
      </select>
    </div>
  );
}

function StatCard({ label, value, accent = 'text-green-400' }: {
  label: string; value: string | number; accent?: string;
}) {
  return (
    <div className="flex-1 min-w-[110px] bg-white/5 border border-white/10 rounded-lg p-3 text-center">
      <div className={`font-pixel text-xl leading-tight ${accent}`}>{value}</div>
      <div className="font-pixel text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-2 mt-1.5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

// Badge que mostra em qual etapa o usuário está
function StepBadge({ step, current, label }: { step: number; current: number; label: string }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className={`flex items-center gap-2 font-pixel text-sm transition-all ${done ? 'text-green-400' : active ? 'text-white' : 'text-slate-600'
      }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-all ${done ? 'bg-green-500 border-green-500' :
          active ? 'bg-transparent border-white' :
            'bg-transparent border-slate-700'
        }`}>
        {done ? '✓' : step}
      </div>
      {label}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  // Config
  const [fr, setFr] = useState(10);
  const [tamanhoPagina, setTamanhoPagina] = useState(50);
  const [pendingFr, setPendingFr] = useState(10);
  const [pendingTamanhoPagina, setPendingTamanhoPagina] = useState(50);

  // Index build state
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [paramsChanged, setParamsChanged] = useState(false);

  // Craft state
  const [slots, setSlots] = useState<string[]>(Array(9).fill('none'));
  const [craftResult, setCraftResult] = useState<CraftResult | null>(null);
  const [craftLoading, setCraftLoading] = useState(false);
  const [craftError, setCraftError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingRandom, setLoadingRandom] = useState(false);

  // Current step: 1=Config, 2=Crafting (index ready)
  const currentStep = indexStats && !paramsChanged ? 2 : 1;

  function handleParamChange(field: 'fr' | 'tp', value: number) {
    if (field === 'fr') setPendingFr(value);
    else setPendingTamanhoPagina(value);
    if (indexStats) setParamsChanged(true);
  }

  async function handleBuildIndex() {
    setBuildLoading(true);
    setBuildError(null);
    setParamsChanged(false);
    setCraftResult(null);
    setHasSearched(false);

    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fr: pendingFr, tamanhoPagina: pendingTamanhoPagina }),
      });
      const data = await res.json();
      if (!res.ok) { setBuildError(data.error ?? 'Erro ao construir índice.'); return; }
      setIndexStats(data.stats);
      setFr(pendingFr);
      setTamanhoPagina(pendingTamanhoPagina);
    } catch {
      setBuildError('Falha na comunicação com o servidor.');
    } finally {
      setBuildLoading(false);
    }
  }

  function setSlot(i: number, v: string) {
    const next = [...slots]; next[i] = v; setSlots(next);
  }

  function clearSlots() {
    setSlots(Array(9).fill('none'));
    setCraftResult(null);
    setCraftError(null);
    setHasSearched(false);
  }

  async function loadRandomRecipe() {
    setLoadingRandom(true);
    try {
      const res = await fetch('/api/sample');
      const data = await res.json();
      if (data.slots) { setSlots(data.slots); setCraftResult(null); setCraftError(null); setHasSearched(false); }
    } catch { /* ignore */ } finally { setLoadingRandom(false); }
  }

  async function handleCraft() {
    setCraftLoading(true);
    setCraftError(null);
    setHasSearched(true);

    try {
      const res = await fetch('/api/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      });
      const data = await res.json();
      if (!res.ok) { setCraftError(data.error ?? 'Erro desconhecido.'); return; }
      setCraftResult(data);
    } catch {
      setCraftError('Falha na comunicação com o servidor.');
    } finally {
      setCraftLoading(false);
    }
  }

  const ganhoIO = craftResult && craftResult.scan.custo > craftResult.indice.custo
    ? (((craftResult.scan.custo - craftResult.indice.custo) / craftResult.scan.custo) * 100).toFixed(1)
    : null;
  const ganhoTempo = craftResult && craftResult.scan.tempo > craftResult.indice.tempo
    ? (craftResult.scan.tempo / craftResult.indice.tempo).toFixed(1)
    : null;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1a1a2e]" style={{
      backgroundImage: 'radial-gradient(ellipse at 20% 20%,rgba(90,173,71,.07) 0%,transparent 55%),radial-gradient(ellipse at 80% 80%,rgba(139,105,20,.07) 0%,transparent 55%)',
    }}>
      <div className="max-w-4xl mx-auto px-4 py-10 pb-20">

        {/* ── HEADER ── */}
        <header className="text-center mb-8">
          <p className="font-pixel text-xs tracking-[.2em] text-green-500 mb-2">
            ESTRUTURA DE DADOS · ÍNDICE HASH ESTÁTICO
          </p>
          <h1 className="font-pixel text-shine text-5xl md:text-6xl leading-tight">
            ⛏️ Minecraft Recipe Hash ⛏️
          </h1>
          <p className="font-pixel text-slate-400 text-lg mt-2">
            Busca por receitas usando Índice Hash Estático vs Table Scan
          </p>
        </header>

        {/* ── STEP INDICATOR ── */}
        <div className="flex items-center gap-4 mb-6 px-2">
          <StepBadge step={1} current={currentStep} label="Configurar & Construir Índice" />
          <div className={`flex-1 h-px transition-colors ${currentStep >= 2 ? 'bg-green-600' : 'bg-slate-700'}`} />
          <StepBadge step={2} current={currentStep} label="Craftar Receitas" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ETAPA 1 — CONFIGURAÇÃO + CONSTRUÇÃO DO ÍNDICE
        ════════════════════════════════════════════════════════════════ */}
        <section className={`bg-[#16213e] border rounded-xl p-6 mb-5 shadow-xl transition-colors ${paramsChanged ? 'border-yellow-600/50' : currentStep === 1 ? 'border-green-600/50' : 'border-[#0f3460]'
          }`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-pixel text-green-400 text-2xl mb-1">⚙️ Configuração do Índice</h2>
              <p className="font-pixel text-slate-500 text-sm">
                Critérios 2, 3, 4 e 6 · Configure os parâmetros e clique em Construir Índice
              </p>
            </div>
            {/* Status badge */}
            {indexStats && !paramsChanged && (
              <span className="font-pixel text-xs bg-green-900/40 text-green-400 border border-green-700/40 rounded-full px-3 py-1 fade-in">
                ✓ Índice pronto
              </span>
            )}
            {paramsChanged && (
              <span className="font-pixel text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-700/40 rounded-full px-3 py-1 fade-in">
                ⚠️ Parâmetros alterados — reconstrua
              </span>
            )}
          </div>

          <div className="flex gap-5 flex-wrap mt-4">
            <div className="flex-1 min-w-[170px]">
              <label className="font-pixel text-slate-400 text-sm block mb-1.5">
                📄 Tamanho da Página
              </label>
              <input id="tamanha-pagina-input" type="number" min={1} max={500}
                value={pendingTamanhoPagina}
                onChange={e => handleParamChange('tp', Number(e.target.value))}
                className="w-full bg-[#2d2d2d] border-2 border-[#555] rounded font-pixel text-white text-base px-3 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
              />
              <p className="font-pixel text-slate-600 text-xs mt-1">Registros por página de disco</p>
            </div>

            <div className="flex-1 min-w-[170px]">
              <label className="font-pixel text-slate-400 text-sm block mb-1.5">
                🪣 Fator de Registro (FR)
              </label>
              <input id="fator-registro-input" type="number" min={1} max={500}
                value={pendingFr}
                onChange={e => handleParamChange('fr', Number(e.target.value))}
                className="w-full bg-[#2d2d2d] border-2 border-[#555] rounded font-pixel text-white text-base px-3 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
              />
              <p className="font-pixel text-slate-600 text-xs mt-1">Cap. por bucket · NB = NR / FR + 1</p>
            </div>

            {/* BUILD BUTTON */}
            <div className="flex items-end">
              <button id="build-btn" onClick={handleBuildIndex} disabled={buildLoading}
                className={`font-pixel text-base text-white rounded px-5 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${paramsChanged
                    ? 'bg-yellow-600 hover:bg-yellow-500 shadow-[0_4px_0_#7a5a00] active:shadow-none active:translate-y-1'
                    : 'bg-green-600 hover:bg-green-500 shadow-[0_4px_0_#2d5a27] active:shadow-none active:translate-y-1'
                  }`}
              >
                {buildLoading
                  ? <span className="mc-pulse">⏳ Construindo…</span>
                  : paramsChanged ? '🔄 Reconstruir Índice' : '⚒️ Construir Índice'}
              </button>
            </div>
          </div>

          {buildError && (
            <div className="fade-in mt-4 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 font-pixel text-red-400 text-sm">
              ❌ {buildError}
            </div>
          )}

          {/* Stats após construção */}
          {indexStats && (
            <div className="fade-in mt-5 pt-4 border-t border-white/5">
              <p className="font-pixel text-slate-500 text-xs mb-3">
                📂 <code className="text-green-400">recipes.txt</code> carregado com FR={fr}, Página={tamanhoPagina}:
              </p>
              <div className="flex gap-2 flex-wrap">
                <StatCard label="Registros" value={indexStats.totalRegistros.toLocaleString('pt-BR')} />
                <StatCard label="Páginas" value={indexStats.totalPaginas.toLocaleString('pt-BR')} accent="text-blue-400" />
                <StatCard label="Buckets" value={indexStats.totalBuckets.toLocaleString('pt-BR')} accent="text-yellow-400" />
                <StatCard label="Construção" value={`${indexStats.tempoConstrucaoMs}ms`} accent="text-slate-400" />
              </div>

              {/* Colisões + Overflows */}
              <div className="flex gap-5 flex-wrap mt-4">
                <div className="flex-1 min-w-[190px]">
                  <div className="flex justify-between items-baseline">
                    <span className="font-pixel text-slate-400 text-sm">💥 Taxa de Colisões</span>
                    <span className="font-pixel text-orange-400 text-lg">{indexStats.taxaColisao}</span>
                  </div>
                  <ProgressBar value={parseFloat(indexStats.taxaColisao)} color="linear-gradient(90deg,#e67e22,#e74c3c)" />
                  <p className="font-pixel text-slate-600 text-xs mt-1">
                    {indexStats.colisoes.toLocaleString('pt-BR')} colisões em {indexStats.totalRegistros.toLocaleString('pt-BR')} inserções
                  </p>
                </div>
                <div className="flex-1 min-w-[190px]">
                  <div className="flex justify-between items-baseline">
                    <span className="font-pixel text-slate-400 text-sm">🌊 Taxa de Overflows</span>
                    <span className="font-pixel text-purple-400 text-lg">{indexStats.taxaOverflow}</span>
                  </div>
                  <ProgressBar value={parseFloat(indexStats.taxaOverflow)} color="linear-gradient(90deg,#9b59b6,#3498db)" />
                  <p className="font-pixel text-slate-600 text-xs mt-1">
                    {indexStats.overflows.toLocaleString('pt-BR')} buckets de overflow criados
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            ETAPA 2 — CRAFTING TABLE (só habilitada após índice pronto)
        ════════════════════════════════════════════════════════════════ */}
        <section className={`bg-[#16213e] border rounded-xl p-6 mb-5 shadow-xl transition-all ${currentStep === 2 ? 'border-[#0f3460] opacity-100' : 'border-[#0f3460] opacity-40 pointer-events-none select-none'
          }`}>
          <h2 className="font-pixel text-green-400 text-2xl mb-1">⚒️ Mesa de Trabalho</h2>
          <p className="font-pixel text-slate-500 text-sm mb-6">
            Critérios 1, 5 e 7 · Índice em memória — buscas instantâneas
          </p>

          {!indexStats && (
            <div className="text-center py-6 font-pixel text-slate-600">
              <div className="text-4xl mb-2">🔒</div>
              <p>Construa o índice primeiro (Etapa 1)</p>
            </div>
          )}

          {indexStats && (
            <div className="flex gap-8 flex-wrap items-start justify-center">
              {/* Crafting Table */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative" style={{ width: 360, height: 200 }}>
                  <Image src="/crafting_table.png" alt="Crafting Table" fill
                    className="pixel-art object-contain select-none pointer-events-none" priority />
                  {/* 3×3 grid overlay */}
                  <div className="absolute grid grid-cols-3"
                    style={{ top: '5%', left: '2%', width: '53%', height: '90%', gap: '2px' }}>
                    {slots.map((item, i) => (
                      <CraftingSlot key={i} index={i} value={item} onChange={v => setSlot(i, v)} />
                    ))}
                  </div>
                  {/* Result slot */}
                  <div className="absolute flex items-center justify-center"
                    style={{ top: '22%', right: '3%', width: '20%', height: '55%' }}>
                    {craftResult?.encontrado && craftResult.itemCraftado ? (
                      <div className="text-3xl fade-in select-none">{RESULT_EMOJI[craftResult.itemCraftado] ?? '✅'}</div>
                    ) : hasSearched && !craftLoading && !craftResult?.encontrado ? (
                      <div className="text-2xl opacity-50">❌</div>
                    ) : null}
                  </div>
                </div>

                {/* Item labels */}
                <div className="grid grid-cols-3 gap-1" style={{ width: 196 }}>
                  {slots.map((item, i) => (
                    <div key={i} className="font-pixel text-center text-xs text-slate-400 truncate px-0.5" title={item}>
                      {item === 'none' ? '—' : item}
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 w-full max-w-xs">
                  <button id="craft-btn" onClick={handleCraft}
                    disabled={craftLoading || loadingRandom}
                    className="flex-2 font-pixel text-base bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded px-4 py-2.5 shadow-[0_4px_0_#2d5a27] active:shadow-none active:translate-y-1 transition-all">
                    {craftLoading ? <span className="mc-pulse">⏳ Buscando…</span> : '🔨 Craftar'}
                  </button>
                  <button id="random-btn" onClick={loadRandomRecipe}
                    disabled={craftLoading || loadingRandom}
                    title="Receita aleatória do dataset"
                    className="flex-1 font-pixel text-base bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded px-3 py-2.5 shadow-[0_4px_0_#1a1a1a] active:shadow-none active:translate-y-1 transition-all">
                    {loadingRandom ? '…' : '🎲'}
                  </button>
                  <button id="clear-btn" onClick={clearSlots}
                    disabled={craftLoading || loadingRandom}
                    className="flex-1 font-pixel text-base bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded px-3 py-2.5 shadow-[0_4px_0_#111] active:shadow-none active:translate-y-1 transition-all">
                    🗑️
                  </button>
                </div>
              </div>

              {/* Result panel */}
              <div className="flex-1 min-w-[200px] flex flex-col justify-center gap-3">
                {!hasSearched && !craftLoading && (
                  <div className="text-center text-slate-600 font-pixel">
                    <div className="text-4xl mb-2">❓</div>
                    <p className="text-sm">Monte a receita ou use 🎲 para uma aleatória</p>
                  </div>
                )}
                {craftLoading && (
                  <div className="mc-pulse text-center text-slate-400 font-pixel">
                    <div className="text-4xl mb-2">⚡</div>
                    <p className="text-base">Buscando no índice em memória…</p>
                    <p className="text-xs text-slate-600 mt-1">(instantâneo — índice já construído)</p>
                  </div>
                )}
                {craftError && (
                  <div className="fade-in bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-center font-pixel">
                    <div className="text-3xl">❌</div>
                    <p className="text-red-400 text-sm mt-2">{craftError}</p>
                  </div>
                )}
                {craftResult && !craftError && (
                  <div className="fade-in flex flex-col gap-2">
                    {craftResult.encontrado ? (
                      <div className="bg-green-900/15 border border-green-600/30 rounded-xl p-4 text-center">
                        <div className="text-4xl">{RESULT_EMOJI[craftResult.itemCraftado ?? ''] ?? '✅'}</div>
                        <div className="font-pixel text-2xl text-shine mt-2">
                          {craftResult.itemCraftado?.toUpperCase()}
                        </div>
                        <p className="font-pixel text-xs text-slate-500 mt-1">
                          Bucket #{craftResult.bucketAcessado} acessado
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-900/15 border border-red-700/30 rounded-xl p-4 text-center">
                        <div className="text-4xl">❌</div>
                        <p className="font-pixel text-red-400 text-base mt-2">Receita não encontrada</p>
                        <p className="font-pixel text-xs text-slate-600 mt-1">Use 🎲 para uma receita garantida</p>
                      </div>
                    )}
                    <p className="font-pixel text-xs text-slate-600 text-center">
                      🔑 <code className="text-slate-500 break-all">{craftResult.chaveBusca}</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ─── COMPARATIVO (aparece após busca) ─── */}
        {craftResult && (
          <section className="bg-[#16213e] border border-[#0f3460] rounded-xl p-6 shadow-xl fade-in">
            <h2 className="font-pixel text-green-400 text-2xl mb-1">⚡ Comparativo de Desempenho</h2>
            <p className="font-pixel text-slate-500 text-sm mb-5">
              Critérios 10 e 11 · Índice Hash vs Table Scan (I/O e tempo)
            </p>

            <table className="w-full border-separate border-spacing-0 mb-4">
              <thead>
                <tr>
                  <th className="font-pixel text-xs text-slate-500 text-left pb-2 border-b border-white/10 w-[38%]">Métrica</th>
                  <th className="font-pixel text-xs text-blue-400 pb-2 border-b border-white/10 text-center">🔵 Índice Hash</th>
                  <th className="font-pixel text-xs text-red-400 pb-2 border-b border-white/10 text-center">🔴 Table Scan</th>
                  <th className="font-pixel text-xs text-green-400 pb-2 border-b border-white/10 text-center">📈 Ganho</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="font-pixel text-slate-400 text-sm py-3">Leituras de disco (I/O)</td>
                  <td className="font-pixel text-blue-400 text-xl text-center font-bold py-3">{craftResult.indice.custo}</td>
                  <td className="font-pixel text-red-400 text-lg text-center py-3">{craftResult.scan.custo.toLocaleString('pt-BR')}</td>
                  <td className="font-pixel text-green-400 text-sm text-center py-3">
                    {ganhoIO ? `${ganhoIO}% menos` : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="font-pixel text-slate-400 text-sm py-3">Tempo de busca</td>
                  <td className="font-pixel text-blue-400 text-xl text-center font-bold py-3">{craftResult.indice.tempo.toFixed(4)}ms</td>
                  <td className="font-pixel text-red-400 text-lg text-center py-3">{craftResult.scan.tempo.toFixed(4)}ms</td>
                  <td className="font-pixel text-green-400 text-sm text-center py-3">
                    {ganhoTempo ? `${ganhoTempo}× mais rápido` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Barra de I/O visual */}
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="font-pixel text-slate-500 text-xs mb-3">Custo de I/O relativo</p>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-pixel text-xs text-blue-400 w-14">Hash</span>
                <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.max(1, (craftResult.indice.custo / craftResult.scan.custo) * 100)}%`,
                      background: 'linear-gradient(90deg,#2196f3,#5aad47)'
                    }} />
                </div>
                <span className="font-pixel text-xs text-blue-400 w-8 text-right">{craftResult.indice.custo}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs text-red-400 w-14">Scan</span>
                <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                  <div className="h-full w-full rounded-full bg-linear-to-r from-red-700 to-red-400" />
                </div>
                <span className="font-pixel text-xs text-red-400 w-8 text-right">{craftResult.scan.custo.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {ganhoIO && (
              <div className="fade-in bg-green-900/15 border border-green-600/25 rounded-lg p-4 text-center">
                <span className="font-pixel text-green-400 text-4xl">{ganhoIO}%</span>
                <p className="font-pixel text-slate-400 text-sm">de leituras economizadas</p>
                {ganhoTempo && (
                  <p className="font-pixel text-yellow-400 text-xl mt-1">{ganhoTempo}× mais rápido</p>
                )}
              </div>
            )}

            <p className="font-pixel text-slate-600 text-xs text-center mt-4">
              💡 O índice hash transforma uma busca <span className="text-red-400">linear O(n)</span> em{' '}
              <span className="text-green-400">tempo constante O(1)</span>, independente do tamanho do arquivo.
            </p>
          </section>
        )}

        <footer className="text-center mt-10 font-pixel text-slate-700 text-sm">
          Estrutura de Dados · S6 · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
