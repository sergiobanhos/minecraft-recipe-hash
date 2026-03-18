/**
 * index-cache.ts
 *
 * Singleton que mantém o StaticHashIndex em memória entre as requisições.
 * O índice só é reconstruído quando `buildIndex()` é chamado explicitamente.
 *
 * Em Next.js (Node.js), variáveis de módulo persistem entre requests no mesmo processo.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { StaticHashIndex } from './hash';

export const RECIPES_PATH = join(process.cwd(), 'src', 'lib', 'recipes.txt');

export type IndexStats = {
    totalRegistros: number;
    totalPaginas: number;
    totalBuckets: number;
    tempoConstrucaoMs: string;
    taxaColisao: string;
    taxaOverflow: string;
    colisoes: number;
    overflows: number;
};

type CachedIndex = {
    db: StaticHashIndex;
    fr: number;
    tamanhoPagina: number;
    stats: IndexStats;
    builtAt: number; // timestamp
};

// Singleton global — persiste entre requests
let cache: CachedIndex | null = null;

export function getCache(): CachedIndex | null {
    return cache;
}

export function buildIndex(fr: number, tamanhoPagina: number): IndexStats {
    if (!existsSync(RECIPES_PATH)) {
        throw new Error(`Arquivo recipes.txt não encontrado em: ${RECIPES_PATH}`);
    }

    const data = readFileSync(RECIPES_PATH, 'utf-8');
    const db = new StaticHashIndex(fr, tamanhoPagina);
    db.carregarDados(data);
    db.construirIndice();

    const raw = db.getEstatisticas();

    const stats: IndexStats = {
        totalRegistros: raw.totalRegistros,
        totalPaginas: raw.totalPaginas,
        totalBuckets: raw.totalBuckets,
        tempoConstrucaoMs: raw.tempoConstrucaoMs,
        taxaColisao: raw.taxaColisao,
        taxaOverflow: raw.taxaOverflow,
        colisoes: raw.colisoes,
        overflows: raw.overflows,
    };

    cache = { db, fr, tamanhoPagina, stats, builtAt: Date.now() };
    return stats;
}
