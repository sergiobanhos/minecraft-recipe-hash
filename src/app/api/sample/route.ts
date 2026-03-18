import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const RECIPES_PATH = join(process.cwd(), 'src', 'lib', 'recipes.txt');

export async function GET() {
    if (!existsSync(RECIPES_PATH)) {
        return NextResponse.json({ error: 'recipes.txt não encontrado' }, { status: 500 });
    }

    const data = readFileSync(RECIPES_PATH, 'utf-8');
    const lines = data.split('\n').filter(l => l.trim() !== '');

    // Pega uma receita aleatória
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    const [key] = randomLine.split(':');
    const slots = key.split('-');

    return NextResponse.json({ slots, key });
}
