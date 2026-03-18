import { NextRequest, NextResponse } from 'next/server';
import { buildIndex, RECIPES_PATH } from '../../../lib/engine/index-cache';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const fr: number = Number(body.fr) || 10;
        const tamanhoPagina: number = Number(body.tamanhoPagina) || 50;

        if (!existsSync(RECIPES_PATH)) {
            return NextResponse.json(
                { error: `Arquivo recipes.txt não encontrado.` },
                { status: 500 }
            );
        }

        const stats = buildIndex(fr, tamanhoPagina);

        return NextResponse.json({ ok: true, stats });
    } catch (err) {
        console.error('[/api/build] Erro:', err);
        return NextResponse.json(
            { error: 'Erro ao construir o índice.' },
            { status: 500 }
        );
    }
}
