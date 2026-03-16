import { writeFileSync } from 'fs';
import { join } from 'path';

const items = [
    "wood", "stone", "iron", "gold", "diamond", "netherite",
    "stick", "cobblestone", "coal", "none"
];

const results = [
    "wood-sword", "stone-sword", "iron-sword", "gold-sword", "diamond-sword", "netherite-sword",
    "wood-pickaxe", "stone-pickaxe", "iron-pickaxe", "gold-pickaxe", "diamond-pickaxe", "netherite-pickaxe"
];

function generateRecipes(count: number) {
    const recipesSet = new Set<string>();

    while (recipesSet.size < count) {
        // Gera 9 slots aleatórios
        const grid = Array.from({ length: 9 }, () => items[Math.floor(Math.random() * items.length)]);
        // Escolhe um resultado aleatório
        const result = results[Math.floor(Math.random() * results.length)];

        // Formato: link-link-link...:resultado
        const recipeKey = grid.join('-');
        recipesSet.add(`${recipeKey}:${result}`);
    }

    return Array.from(recipesSet).join('\n');
}

const numRecipes = process.argv[2] ? parseInt(process.argv[2]) : 999999;
const filePath = join(__dirname, 'recipes.txt');

console.log(`Gerando ${numRecipes} receitas em ${filePath}...`);
writeFileSync(filePath, generateRecipes(numRecipes));
console.log('Concluído!');
