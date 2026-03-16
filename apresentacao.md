# 1
Quantas combinações de itens são possíveis no Minecraft?

A = n^k
Onde:
- n = Número de opções possíveis para cada slot (quantidade de itens disponíveis + 1 para o slot "vazio").
- k = Número de slots no grid (9 para a mesa 3x3).

# 2
Agora imagine que nos temos um arquivo que guarde todas as receitas, no seguinte formato:

```
recipes.txt

none-wood-none-none-wood-none-none-stick-none:wood-sword
none-stone-none-none-stone-none-none-stick-none:stone-sword
none-iron-none-none-iron-none-none-stick-none:iron-sword
...
...

```

# 3
E como fazemos para descobrir o item que vai ser craftado?
Podemos fazer um for loop que vai percorrer todas as combinações possíveis e verificar se a receita existe no arquivo, correto?


# 4
Mas e se o nosso arquivo de receitas tiver 1 milhão de combinações?

O nosso for loop vai ter que percorrer 1 milhão de combinações, o que vai demorar muito tempo.


# 5 
E é aí que entra o **Índice Hash Estático**.

# 6
### O "Pulo do Gato": Como o Índice Filtra os Dados?

Imagine que nosso arquivo tem **1 milhão de receitas** organizadas em **20 mil páginas** (caixas).

1.  **Sem Índice (Table Scan):**
    É como abrir as 20.000 caixas uma por uma e ler cada um dos 1.000.000 de papéis.
    *   **Esforço:** Máximo.
    *   **Custo:** 20.000 leituras de disco.

2.  **Com o Índice (Nossa Solução):**
    *   **A Função Hash** te dá o número do **Bucket** (uma gaveta específica).
    *   No Bucket, você descobre o endereço exato: *"Página 15.402"*.
    *   O sistema pula direto para essa página e lê apenas as **50 receitas** que estão nela.
    *   **Esforço:** Mínimo.
    *   **Custo:** 2 leituras de disco.

# 7
**Total de trabalho:** 1 cálculo matemático + 1 consulta ao bucket + 1 leitura de página.

# 8
### Testando na Prática (Mesa de Trabalho)

Nós criamos um script `craft.ts` que simula a interface do jogo:

```bash
bun src/lib/craft.ts wood-none-none-stick-none-none-stick-none-none
```

**O que o sistema faz:**
-----------------------------------------
⚒️  MESA DE TRABALHO (CRAFTING TABLE)
-----------------------------------------
[ wood       ][ none       ][ none       ]
[ stick      ][ none       ][ none       ]
[ stick      ][ none       ][ none       ]
-----------------------------------------
✅ SUCESSO! Você craftou: WOOD-PICKAXE
Index Search took 0.0150ms 
-----------------------------------------

# 8
### Resultados do Teste de Estresse (~1 Milhão de registros)

Ao buscar uma receita no final do arquivo:

-   **Sem Índice (Table Scan):** Precisou ler **20.000 páginas** do disco.
-   **Com Índice (Hash):** Precisou de apenas **2 leituras** (Bucket + Página).

**Conclusão:**
O índice transformou um problema de processar **1.000.000 de linhas** em um problema de processar apenas **100** (Fator de Registro 100). Um ganho de eficiência de **99.99%**.

# 8
### Conclusão
O índice hash transforma uma busca "linear" (lenta) em uma busca de "tempo constante" (quase instantânea), independente do tamanho do arquivo.