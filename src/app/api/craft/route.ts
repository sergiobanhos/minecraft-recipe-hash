import { NextRequest, NextResponse } from 'next/server';
import { getCache } from '../../../lib/engine/index-cache';

export async function POST(req: NextRequest) {
    try {
        const cached = getCache();

        if (!cached) {
            return NextResponse.json(
                { error: 'Índice não construído. Clique em "Construir Índice" antes de buscar.' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const slots: string[] = body.slots ?? [];

        if (slots.length !== 9) {
            return NextResponse.json(
                { error: 'É necessário enviar exatamente 9 slots.' },
                { status: 400 }
            );
        }

        const { db } = cached;
        const chaveBusca = slots.join('-');

        // Buscas (sem reconstruir o índice!)
        const resIndice = db.buscarPorIndice(chaveBusca);
        const resScan = db.tableScan(chaveBusca);

        // Descobre o item craftado
        let itemCraftado: string | null = null;
        if (resIndice.encontrado && resIndice.pagina !== undefined) {
            const pagina = db.paginas[resIndice.pagina];
            const linha = pagina.find((l: string) => l.startsWith(chaveBusca + ':'));
            itemCraftado = linha?.split(':')[1] ?? null;
        }

        // Calcula o bucket acessado
        let bucketAcessado: number | null = null;
        if (db.buckets.length > 0) {
            let hash = 0;
            for (let i = 0; i < chaveBusca.length; i++) {
                hash = (hash * 31) + chaveBusca.charCodeAt(i);
            }
            bucketAcessado = Math.abs(hash) % db.buckets.length;
        }

        return NextResponse.json({
            encontrado: resIndice.encontrado,
            itemCraftado,
            chaveBusca,
            bucketAcessado,
            indice: { custo: resIndice.custo, tempo: resIndice.tempo },
            scan: { custo: resScan.custo, tempo: resScan.tempo },
            // Repassa as stats do cache (não recalcula)
            stats: cached.stats,
        });
    } catch (err) {
        console.error('[/api/craft] Erro:', err);
        return NextResponse.json(
            { error: 'Erro interno ao processar a receita.' },
            { status: 500 }
        );
    }
}
