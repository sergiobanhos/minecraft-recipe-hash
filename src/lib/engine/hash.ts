import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * REQUISITOS (RESUMO):
 * HU01 - Carregar arquivo (Simulado p/ string ou arquivo)
 * HU02 - Definir tamanho de página
 * HU03 - Dividir registros em páginas
 * HU04 - Criar buckets do índice
 * HU05 - Função hash configurável
 * HU06 - Construir o índice percorrendo as páginas
 * HU07/HU08 - Resolução de colisões e Overflow
 * HU09 - Buscar chave usando índice
 * HU10 - Table Scan
 * HU11 - Comparação Índice vs Scan
 * HU12/HU13 - Taxa de Colisões/Overflow
 */

export type Tupla = string;
export type Pagina = Tupla[];

export type EntradaBucket = {
    chaveDeBusca: string;
    enderecoPagina: number;
};

export type Bucket = {
    entradas: EntradaBucket[];
    overflow?: Bucket;
};

export class StaticHashIndex {
    public paginas: Pagina[] = [];
    public buckets: Bucket[] = [];
    public registros: Tupla[] = [];

    private NB: number = 0; // Numero de Buckets
    private FR: number;    // Capacidade do bucket (Fator de Registro)
    private tamanhoPagina: number;

    // Métricas
    public tempoConstrucao: number = 0;
    public totalColisoes: number = 0;
    public totalOverflows: number = 0;

    constructor(fr: number = 10, tamanhoPagina: number = 50) {
        this.FR = fr;
        this.tamanhoPagina = tamanhoPagina;
    }

    /** HU01 - Carregar arquivo */
    public carregarDados(conteudo: string) {
        this.registros = conteudo.split('\n').filter(r => r.trim() !== '');
        this.dividirEmPaginas();
    }

    /** HU02/HU03 - Dividir registros em páginas */
    private dividirEmPaginas() {
        this.paginas = [];
        for (let i = 0; i < this.registros.length; i += this.tamanhoPagina) {
            this.paginas.push(this.registros.slice(i, i + this.tamanhoPagina));
        }
    }

    /** HU04/HU05 - Configurar e construir índice */
    public construirIndice() {
        if (this.registros.length === 0) return;

        const nr = this.registros.length;
        // RN08: NB > NR / FR
        this.NB = Math.floor(nr / this.FR) + 1;

        // Inicializa buckets (HU04)
        this.buckets = Array.from({ length: this.NB }, () => ({ entradas: [] }));
        this.totalColisoes = 0;
        this.totalOverflows = 0;

        const inicio = performance.now();

        // HU06 - Percorrer páginas e registros
        for (let numPagina = 0; numPagina < this.paginas.length; numPagina++) {
            for (let registro of this.paginas[numPagina]) {
                const chave = this.extrairChave(registro);
                this.inserirNoIndice(chave, numPagina);
            }
        }

        const fim = performance.now();
        this.tempoConstrucao = fim - inicio;
    }

    private extrairChave(registro: string): string {
        return registro.split(':')[0];
    }

    /** HU05 - Função Hash */
    private aplicarHash(chave: string): number {
        let hash = 0;
        for (let i = 0; i < chave.length; i++) {
            hash = (hash * 31) + chave.charCodeAt(i);
        }
        return Math.abs(hash) % this.NB;
    }

    /** HU07/HU08 - Inserção com Colisão e Overflow */
    private inserirNoIndice(chave: string, enderecoPagina: number) {
        const enderecoBucket = this.aplicarHash(chave);
        let bucketAtual = this.buckets[enderecoBucket];

        // Navega até o final da cadeia de overflow ou bucket com espaço
        while (bucketAtual.entradas.length >= this.FR) {
            // Se já está cheio, houve colisão (RN14: somente quando ultrapassa FR)
            this.totalColisoes++;

            if (!bucketAtual.overflow) {
                // Se não tem overflow, cria um (HU08)
                bucketAtual.overflow = { entradas: [] };
                this.totalOverflows++;
            }
            bucketAtual = bucketAtual.overflow;
        }

        bucketAtual.entradas.push({
            chaveDeBusca: chave,
            enderecoPagina
        });
    }

    /** HU09 - Busca por Índice */
    public buscarPorIndice(chave: string) {
        const inicio = performance.now();
        const enderecoBucket = this.aplicarHash(chave);
        let bucketAtual = this.buckets[enderecoBucket];
        let leiturasCusto = 1; // Pelo menos o bucket inicial

        while (bucketAtual) {
            const entrada = bucketAtual.entradas.find(e => e.chaveDeBusca === chave);
            if (entrada) {
                const fim = performance.now();
                return {
                    encontrado: true,
                    pagina: entrada.enderecoPagina,
                    custo: leiturasCusto + 1, // +1 para ler a página de dados (RN19)
                    tempo: fim - inicio
                };
            }
            if (bucketAtual.overflow) {
                leiturasCusto++;
                bucketAtual = bucketAtual.overflow;
            } else {
                break;
            }
        }

        const fim = performance.now();
        return { encontrado: false, tempo: fim - inicio, custo: leiturasCusto };
    }

    /** HU10 - Table Scan */
    public tableScan(chave: string) {
        const inicio = performance.now();
        let registrosLidos = 0;
        let paginasLidas = 0;

        for (let i = 0; i < this.paginas.length; i++) {
            paginasLidas++;
            for (let registro of this.paginas[i]) {
                registrosLidos++;
                if (this.extrairChave(registro) === chave) {
                    const fim = performance.now();
                    return {
                        encontrado: true,
                        pagina: i,
                        custo: paginasLidas,
                        registrosLidos,
                        tempo: fim - inicio
                    };
                }
            }
        }

        const fim = performance.now();
        return { encontrado: false, tempo: fim - inicio, custo: paginasLidas };
    }

    /** HU12/HU13 - Estatísticas */
    public getEstatisticas() {
        const totalRegistros = this.registros.length;
        return {
            totalRegistros,
            totalPaginas: this.paginas.length,
            totalBuckets: this.NB,
            tempoConstrucaoMs: this.tempoConstrucao.toFixed(4),
            taxaColisao: ((this.totalColisoes / totalRegistros) * 100).toFixed(2) + '%',
            taxaOverflow: ((this.totalOverflows / this.NB) * 100).toFixed(2) + '%',
            colisoes: this.totalColisoes,
            overflows: this.totalOverflows
        };
    }
}

// --- Execução Principal ---

const recipesFilePath = join(__dirname, 'recipes.txt');

if (existsSync(recipesFilePath)) {
    const data = readFileSync(recipesFilePath, 'utf-8');

    // Configurações (Podem vir de input do usuário no futuro)
    const FR = 10;
    const TAMANHO_PAGINA = 50;

    const db = new StaticHashIndex(FR, TAMANHO_PAGINA);
    db.carregarDados(data);
    db.construirIndice();

    console.log(`\n--- Índice Construído a partir de: ${recipesFilePath} ---`);
    console.table(db.getEstatisticas());

    // Pega a última receita para testar o pior caso do Table Scan
    const ultimaReceita = db.registros[db.registros.length - 1];
    const chaveBusca = ultimaReceita.split(':')[0];

    console.log(`\nBuscando Chave (Pior Caso): "${chaveBusca}"`);

    const resIndice = db.buscarPorIndice(chaveBusca);
    const resScan = db.tableScan(chaveBusca);

    console.log('Resultado Índice:', resIndice);
    console.log('Resultado Table Scan:', resScan);

    if (resIndice.encontrado && resScan.encontrado) {
        const economia = (((resScan.custo - resIndice.custo) / resScan.custo) * 100).toFixed(2);
        console.log(`\nEFICIÊNCIA: O índice economizou ${resScan.custo - resIndice.custo} leituras de página (${economia}% de ganho).`);
    }
} else {
    console.log(`\nArquivo ${recipesFilePath} não encontrado.`);
    console.log(`Execute 'bun src/lib/generator.ts <quantidade>' para gerar o arquivo primeiro.`);
}
