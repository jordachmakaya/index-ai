# Analyse du run publié du benchmark index-ai (§13.4)

**Fichier de résultats** : `benchmark/results/2026-08-12-seed20260813.json`
**Statut** : Published · **Date** : 2026-08-12
**Corpus** : 250 sites synthétiques (50 par niveau × 5 niveaux) · seed `20260813`
**Requêtes** : 1 250 (250 sites × 5 types) · **Régénération** : ~0,5 s (déterministe, verrouillée par `tests/benchmark-full.spec.ts`)

---

## 1. La question posée

> **Dans quelle mesure les artefacts index-ai — manifest (L1), agent index (L2a/L2b), interface de requête (L3) — réduisent-ils la consommation de tokens nécessaire à un agent pour répondre à des questions sur un site web, tout en préservant sa capacité à citer le contenu correct ?**

Concrètement, pour chaque site du corpus et chaque type de question, le harness mesure :

1. **Combien de tokens** l'agent doit lire pour répondre (heuristique §9.3 : caractères NFC / 4) — selon le protocole de consommation de chaque niveau (L0 = page HTML entière ; L1 = manifest seul ; L2 = index + fetch ciblé en 2 phases §7 ; L3 = requête + enregistrements retournés).
2. **Si la réponse correcte est présente** dans le payload consommé (vérification par containment, déterministe) — le proxy de « citation ».

Les 5 types de questions (vérité-terrain embarquée dans le contenu) :

| Type | Question que l'agent doit répondre |
|---|---|
| `identity` | Qui publie ce site et qu'est-ce qu'il couvre ? |
| `freshness` | Quand un élément précis a-t-il été mis à jour ? |
| `specific-fact` | Quel est le prix / la durée d'un élément précis ? |
| `listing` | Liste tous les éléments disponibles sur le site. |
| `cross-reference` | Quels éléments sont liés à un autre nœud ? |

---

## 2. Résultats

### 2.1 Par niveau (1 250 requêtes)

| Level | Requêtes | Mean tokens | Médiane | Min | Max | p90 | Taux de citation |
|---|---|---|---|---|---|---|---|
| **L0** — HTML brut | 250 | 955 | 952 | 908 | 1021 | 989 | 100 % |
| **L1** — Manifest | 250 | 145 | 147 | 137 | 153 | 150 | **40 %** |
| **L2a** — Index | 250 | 147 | 162 | 92 | 202 | 188 | 100 % |
| **L2b** — Graphe | 250 | 147 | 162 | 92 | 207 | 187 | 100 % |
| **L3** — Query | 250 | 210 | 190 | 137 | 302 | 292 | 100 % |

### 2.2 Par type de requête (mean tokens / taux de citation)

| Level | identity | freshness | specific-fact | listing | cross-reference |
|---|---|---|---|---|---|
| **L0** | 955 / 100 % | 955 / 100 % | 955 / 100 % | 955 / 100 % | 955 / 100 % |
| **L1** | 145 / 100 % | 145 / 100 % | 145 / **0 %** | 145 / **0 %** | 145 / **0 %** |
| **L2a** | 103 / 100 % | 170 / 100 % | 172 / 100 % | 103 / 100 % | 185 / 100 % |
| **L2b** | 104 / 100 % | 171 / 100 % | 172 / 100 % | 104 / 100 % | 186 / 100 % |
| **L3** | 178 / 100 % | 281 / 100 % | 238 / 100 % | 176 / 100 % | 175 / 100 % |

### 2.3 Ratios d'efficacité (coût relatif vs L0)

| Ratio | Valeur |
|---|---|
| L0 / L1 | **6,6×** (L1 = 15,2 % du coût L0) |
| L0 / L2a | **6,5×** (L2a = 15,4 % du coût L0) |
| L0 / L3 | **4,6×** (L3 = 22,0 % du coût L0) |

---

## 3. Analyse du run

### 3.1 L1 — le manifest est une « carte de visite », pas un moteur de recherche

- Coût **quasi constant** (137–153 tokens, dispersion < 12 %) : le manifest est un payload fixe, indépendant du type de question.
- Il répond **parfaitement (100 %)** aux questions méta — qui publie, quand c'est mis à jour — et **structurellement pas (0 %)** aux questions de contenu (le manifest ne transporte aucun contenu).
- **Lecture** : 40 % de citation globale = 2 des 5 types répondus. Ce n'est pas un défaut d'implémentation, c'est le contrat du niveau : *ce que le site est*, pas *ce qu'il contient*.

### 3.2 L2a/L2b — la récupération complète à ~15 % du coût

- **100 % de citation sur les 5 types** à **147 tokens de moyenne** (vs 955 pour le HTML) : gain **6,5×**.
- Distribution **bimodale** révélatrice du modèle 2 phases (§7) :
  - `identity` / `listing` : ~103 tokens — **répondues depuis les résumés de l'index seuls** (phase 1, min observé 92 tokens) ;
  - `freshness` / `specific-fact` / `cross-reference` : ~170–185 tokens — nécessitent le **fetch ciblé** du nœud sélectionné (phase 2).
- L2a et L2b sont **statistiquement identiques** sur ce corpus (graphes mono-page : la relation est naviguée, pas payée deux fois). La différence apparaîtra sur les graphes paginés (RFC-006).

### 3.3 L3 — l'interface de requête livre exactement la demande

- **100 % de citation** à **22 % du coût L0** (210 vs 955).
- Coût **variable** (137–302, p90 292) : il dépend du nombre d'enregistrements retournés et de la sérialisation des faits + résumés.
- Point notable : sur `cross-reference`, **L3 (175) est moins cher que L2a (185)** — la requête typée bat le fetch ciblé quand la question est relationnelle.
- Compromis assumé : sur les questions simples (`identity`/`listing`), L3 (176–178) est plus cher que L2a (103–104) — l'agent paie la sérialisation de la réponse.

### 3.4 Le message global du run

| Besoin de l'agent | Niveau | Coût | Citation |
|---|---|---|---|
| « C'est qui, ce site ? » | L1 | 15 % de L0 | 100 % |
| « Réponds-moi sur le contenu » | L2a/L2b | 15 % de L0 | 100 % |
| « Donne-moi les données exactes » | L3 | 22 % de L0 | 100 % |
| *(référence : page HTML brute)* | *L0* | *100 %* | *100 %* |

La valeur de chaque niveau de l'échelle est **démontrée par construction** : le gain d'efficacité (6,5×) ne se paie pas en capacité de réponse — il s'achète avec les artefacts structurés.

---

## 4. Les claims défendables

### 4.1 Claims que le run **supporte** (formulations prêtes à l'emploi)

**Français :**
1. « Sur un corpus déterministe de 250 sites synthétiques (1 250 requêtes, 5 types), le manifest index-ai réduit la consommation de tokens d'un facteur ~6,6 par rapport au HTML brut (145 vs 955 tokens par requête) pour les questions d'identité et de fraîcheur, avec 100 % de citation. »
2. « L'Agent Index (L2a/L2b) atteint 100 % de citation sur les cinq types de questions à ~15 % du coût en tokens de la page HTML (147 vs 955) — soit un gain ~6,5× sans perte de capacité de réponse. »
3. « L'interface de requête (L3) maintient 100 % de citation à 22 % du coût L0 (210 vs 955), et devient même moins chère que l'index sur les questions relationnelles (cross-reference : 175 vs 185). »
4. « Le niveau 1 est un contrat scopé : il répond aux questions méta (identité, fraîcheur) à 100 % et ne prétend pas répondre aux questions de contenu (0 %, par conception) — les niveaux 2+ apportent le contenu. »
5. « Le run est entièrement reproductible : même seed → dataset identique, régénéré et verrouillé par des tests d'intégrité. »

**English (pour l'annonce publique) :**
1. "On a deterministic corpus of 250 synthetic sites (1,250 queries, 5 types), the index-ai manifest cuts token consumption ~6.6× vs raw HTML (145 vs 955 tokens per query) for identity and freshness questions, at 100% citation."
2. "The Agent Index (L2a/L2b) reaches 100% citation on all five query types at ~15% of the HTML page's token cost (147 vs 955) — a ~6.5× saving with no loss of answering capability."
3. "The query interface (L3) keeps 100% citation at 22% of the L0 cost (210 vs 955), and is cheaper than the index on relationship queries (cross-reference: 175 vs 185)."
4. "Level 1 is a scoped contract: it answers meta questions (identity, freshness) at 100% and, by design, not content questions (0%) — Levels 2+ deliver the content."
5. "The run is fully reproducible: same seed → identical dataset, regenerated and locked by integrity tests."

### 4.2 Claims qu'il **ne faut PAS** faire

1. ❌ « index-ai réduit les coûts de tokens de X % sur le web réel » — le corpus est **synthétique** ; les pourcentages mesurent le *mécanisme*, pas l'adoption réelle.
2. ❌ « Les agents répondent mieux » — la citation est vérifiée par **containment de sous-chaîne** (déterministe), pas par correction sémantique d'une réponse LLM réelle.
3. ❌ « Le tokenizer est celui d'un vrai modèle » — l'heuristique §9.3 (`chars / 4`) est calibrée pour l'anglais ; un tokenizer réel (ex. tiktoken) donnera des valeurs différentes.
4. ❌ « L3 fonctionne comme ça en production » — L3 est une **projection déterministe** du contrat §8, pas un serveur MCP réel.
5. ❌ « Ces chiffres valident les estimations d'effort d'implémentation (15 min / 2 h) » — le benchmark mesure la consommation, pas le coût de mise en œuvre.
6. ❌ « Économies garanties pour les sites non anglophones » — les règles par langue de §9.3 n'ont pas été exercées.

---

## 5. Reproductibilité

```bash
# reproduire le dataset publié à l'identique
pnpm benchmark                       # = node benchmark/run.mjs --sites-per-level 50 --seed 20260813 --status Published

# vérifier l'intégrité (meta, agrégats, ordre des tokens, matrice de citation, régénération identique)
pnpm vitest run tests/benchmark-full.spec.ts
```

Le seed, la règle de tokens, le statut et le nombre de niveaux sont enregistrés dans le meta de chaque fichier de résultats.

---

## 6. Références

- Protocole complet (méthodologie, limites, gouvernance) : `benchmark/README.md`
- Générateur de corpus : `benchmark/corpus.mjs` · Harness : `benchmark/run.mjs`
- Section normative : SPEC §13.4 (Public benchmark), §13.5 (Maturity matrix), §7 (deux phases), §9.3 (règle de tokens)
