import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { StaticHashIndex } from './engine/hash';

const recipesFilePath = join(__dirname, 'recipes.txt');
const recipeToCraft = process.argv[2];

if (!recipeToCraft) {
    console.log('\x1b[33m%s\x1b[0m', 'Uso: bun src/lib/craft.ts <string-da-receita>');
    console.log('Exemplo: bun src/lib/craft.ts wood-none-none-stick-none-none-stick-none-none');
    process.exit(1);
}

if (!existsSync(recipesFilePath)) {
    console.error('Arquivo recipes.txt não encontrado. Gere as receitas primeiro.');
    process.exit(1);
}

// Carregando e Indexando
console.log('⏳ Carregando 1 milhão de receitas e construindo índice...');
const data = readFileSync(recipesFilePath, 'utf-8');
const db = new StaticHashIndex(50, 10); // Ajustado para volume maior
db.carregarDados(data);
db.construirIndice();

console.log('\n-----------------------------------------');
console.log('⚒️  MESA DE TRABALHO (CRAFTING TABLE)');
console.log('-----------------------------------------');

// Visualização em Grid 3x3
const slots = recipeToCraft.split('-');
if (slots.length >= 9) {
    console.log(`[ ${slots[0].padEnd(10)} ][ ${slots[1].padEnd(10)} ][ ${slots[2].padEnd(10)} ]`);
    console.log(`[ ${slots[3].padEnd(10)} ][ ${slots[4].padEnd(10)} ][ ${slots[5].padEnd(10)} ]`);
    console.log(`[ ${slots[6].padEnd(10)} ][ ${slots[7].padEnd(10)} ][ ${slots[8].padEnd(10)} ]`);
} else {
    console.log(`Receita: ${recipeToCraft}`);
}

console.log('-----------------------------------------');

const resIndice = db.buscarPorIndice(recipeToCraft);
const resScan = db.tableScan(recipeToCraft);

if (resIndice.encontrado && resIndice.pagina !== undefined) {
    const page = db.paginas[resIndice.pagina];
    const fullLine = page.find((line: string) => line.startsWith(recipeToCraft + ':'));
    const itemName = fullLine?.split(':')[1];

    console.log(`\x1b[32m%s\x1b[0m`, `✅ SUCESSO! Você craftou: ${itemName?.toUpperCase()}`);

    console.log('\n--- Comparação de Desempenho ---');
    console.log(`Métrica      | Table Scan (Linear) | Índice Hash (Direto)`);
    console.log(`-------------|---------------------|--------------------`);
    console.log(`Leituras (IO)| ${resScan.custo.toString().padEnd(19)} | ${resIndice.custo.toString().padEnd(18)}`);
    console.log(`Tempo (ms)   | ${resScan.tempo.toFixed(4).padEnd(19)} | ${resIndice.tempo.toFixed(4).padEnd(18)}`);

    const economia = resScan.custo - resIndice.custo;
    const speedup = (resScan.tempo / resIndice.tempo).toFixed(1);

    if (economia > 0) {
        const perc = ((economia / resScan.custo) * 100).toFixed(2);
        console.log('\n\x1b[36m%s\x1b[0m', `📊 RESULTADO: O índice foi ${speedup}x mais rápido e economizou ${economia} leituras (${perc}% de ganho).`);
    } else if (economia === 0) {
        console.log('\n\x1b[33m%s\x1b[0m', `📊 RESULTADO: Para esta posição, o custo de I/O foi idêntico, mas o índice foi ${speedup}x mais rápido.`);
    } else {
        console.log('\n\x1b[35m%s\x1b[0m', `📊 NOTA: Como a receita está no início do arquivo, o Table Scan achou rápido. O índice sempre gasta pelo menos 2 leituras (Bucket + Página).`);
        console.log(`\x1b[35m%s\x1b[0m`, `A vantagem do índice cresce exponencialmente à medida que a receita fica mais "longe" no arquivo.`);
    }
} else {
    console.log(`\x1b[31m%s\x1b[0m`, '❌ ERRO: Receita não encontrada no banco de dados.');
    console.log(`Páginas percorridas no Table Scan: ${resScan.custo}`);
}
console.log('-----------------------------------------\n');
