# Analysis Logic & Algorithms



This document defines the mathematical logic and algorithms for the analysis modules. It ensures scientific accuracy in all calculations.

## 1. Species Area Curve (SAC)

**Goal**: Determine the minimum area required to sample the community adequately.

### A. Cumulative (Nested/Grid)
Used when plots have a specific spatial order (e.g., contiguous grid).

**Algorithm**:
1.  **Input**: Ordered list of plots $P_1, P_2, ..., P_N$.
2.  **Process**:
    *   Step 1: Calculate richness of $P_1$.
    *   Step 2: Calculate richness of pooled $P_1 + P_2$.
    *   ...
    *   Step $i$: Calculate richness of pooled $P_1 ... P_i$.
    *   **Definition**: $UniqueSpecies(P)$ = set of species with at least one record (tree or vegetation) in the pooled plots.
    *   **Note**: "Richness" refers to **presence/absence** counts, not abundance-weighted.
3.  **Output**: Curve of (Cumulative Area vs. Cumulative Richness).
    *   *Area*: If plots are equal-sized, $A_i = i \times A_{plot}$. If nested/irregular, use the bounding box area.

### B. Random Accumulation (Smoothed)
Used when plots are random samples.

**Algorithm**:
1.  **Input**: Set of $N$ plots.
2.  **Process**: Perform $k$ permutations (e.g., 100 iterations).
    *   Shuffle plot order.
    *   Calculate cumulative richness curve.
3.  **Output**: Average richness $\bar{S}_k$ for each accumulation step $k$ (number of plots), with Standard Deviation. If plot areas differ, cumulative area $A_k$ is also computed for each step.

### C. Model Fitting
**Goal**: Test curve behavior and find sample sufficiency (slope $\to$ 0).

| Model | Equation | Meaning |
| :--- | :--- | :--- |
| **Power** | $S = c A^z$ | Most common theoretical SAC. $z$-value allows quantitative site comparison. |
| **Logarithmic** | $S = c + z \ln A$ | Emphasizes habitat heterogeneity. |
| **Michaelis-Menten** | $S = \frac{S_{max} A}{k + A}$ | Asymptote detection ($S_{max}$). Useful for estimating total species pool. |

## 2. Diversity Indices

**Goal**: Quantify biodiversity within a plot or project (Alpha Diversity).

### A. Shannon-Wiener Index ($H'$)
$$H' = -\sum_{i=1}^{S} p_i \ln p_i$$

*   **Note**: $\ln$ denotes the **natural logarithm** (base $e$).
*   **Implementation Note**: Species with $n_i = 0$ are omitted from the sum to avoid $\ln(0)$.
*   $S$: Total number of species.
*   $p_i$: Proportion of individuals belonging to species $i$ ($n_i / N$).
*   $n_i$: Count of individuals of species $i$.
*   $N$: Total number of individuals.

### B. Simpson's Index ($D$)
$$D = \sum_{i=1}^{S} p_i^2$$
*   Often reported as **Simpson's Diversity Index ($1 - D$)** or **Reciprocal Index ($1/D$)**.

## 3. Abundance & Dominance

**Goal**: Identify key species.

### A. Relative Abundance ($RA$)
$$RA_i = \frac{n_i}{N} \times 100$$

### B. Relative Frequency ($RF$)
$$RF_i = \frac{f_i}{\sum f} \times 100$$
*   $f_i$: Number of plots where species $i$ occurs.
*   $\sum f$: Sum of frequencies of all species.

### C. Relative Density ($RD$)
$$RD_i = \frac{\text{Density}_i}{\sum \text{Density}} \times 100$$
*   $\text{Density}_i = \frac{n_i}{\text{Total Area Sampled}}$
*   **Units**: Density is typically calculated per **Hectare (ha)**. (Total Area Sampled must be expressed in ha).

### D. Important Value Index (IVI)
$$IVI_i = RA_i + RF_i + RD_i$$
*   Range: 0 - 300.

## 4. Multi-Stem Calculations

**Rule**: For biomass/basal area calculations, multi-stem trees are treated as follows:

1.  **Basal Area ($BA$)**: Sum of individual stem BAs.
    $$BA_{tree} = \sum_{j=1}^{k} \frac{GBH_j^2}{4\pi}$$
    *   **Units**: If GBH is in **meters**, BA is in **$m^2$**.
    *   **Note**: If field data are recorded in **cm**, they must be converted ($GBH_m = GBH_{cm} / 100$) before applying the formula.
2.  **Equivalent GBH**: The GBH of a single stem with the same Basal Area.
    $$GBH_{eq} = \sqrt{\sum (GBH_j)^2}$$

## 5. Analysis Configuration Schema

To save the "Spatial Arrangement" for SAC, we need a small config entity.

```typescript
interface AnalysisConfig {
  id: string;
  projectId: string;
  moduleId: string; // The VegetationModule this analysis belongs to
  type: 'SAC_SPATIAL' | 'SAC_RANDOM';
  name: string; // "North Slope Curve"
  
  // For Spatial SAC: Ordered list of plots
  plotSequence?: string[]; // [PlotId1, PlotId2, ...]
  
  // For Random SAC (optional)
  iterations?: number;  // e.g. 100
  randomSeed?: string;  // optional for reproducibility
  
  createdAt: number;
  updatedAt: number;
}
```

## 6. Beta Diversity (Turnover)

**Goal**: Quantify the difference in species composition between two plots or sites.

### A. Jaccard Similarity Index ($J$)
Based on presence/absence.
$$J = \frac{a}{a + b + c}$$
*   $a$: Number of species common to both sites.
*   $b$: Number of species unique to Site 1.
*   $c$: Number of species unique to Site 2.
*   **Range**: 0 (no overlap) to 1 (identical).
*   **Note**: Jaccard Dissimilarity can be reported as $1 - J$.

### B. Bray-Curtis Dissimilarity ($BC$)
Based on abundance counts.
$$BC_{ij} = \frac{\sum |n_{ik} - n_{jk}|}{\sum (n_{ik} + n_{jk})}$$
*   $n_{ik}$: Count of species $k$ in site $i$.
*   $n_{jk}$: Count of species $k$ in site $j$.
*   **Range**: 0 (identical) to 1 (completely different).
*   **Note**: Zero-coverage species (absent from both sites) are ignored.

## 7. Evenness

**Goal**: Measure how equal the abundances of the species are.

### A. Pielou's Evenness Index ($J'$)
$$J' = \frac{H'}{\ln S}$$
*   $H'$: Shannon-Wiener Index.
*   $S$: Total number of species.
*   **Range**: 0 (one species dominates) to 1 (all species equally abundant).
*   **Note**: If $S=1$, $J'$ is undefined (or set to 0).

## 8. Rarefaction (Expected Richness)

**Goal**: Compare species richness across sites with different sampling efforts (different $N$).

### A. Individual-Based Rarefaction ($E(S_n)$)
Calculates the expected number of species $E(S_n)$ in a random subsample of $n$ individuals from the total pool $N$.

$$E(S_n) = \sum_{i=1}^{S} \left[ 1 - \frac{\binom{N - N_i}{n}}{\binom{N}{n}} \right]$$

*   $N$: Total number of individuals in the sample.
*   $N_i$: Count of individuals of species $i$.
*   $n$: Size of the subsample (must be $\le N$).
*   $\binom{n}{k}$: Binomial coefficient (combinations).
*   **Note**: In Terra, $n$ defaults to the minimum $N$ across compared sites.

## 9. Advanced Diversity Metrics (Trait & Tree)

**Goal**: Incorporate evolutionary history or functional traits.
**Prerequisite**: These analyses are only enabled when required data (phylogenetic trees or trait matrices) are available.

### A. Phylogenetic Diversity (Faith's PD)
Requires a phylogenetic tree.
$$PD = \sum_{b \in T} L_b$$
*   Sum of branch lengths ($L_b$) for all branches $b$ spanning the species present in the sample.

### B. Functional Diversity (Rao's Q)
Requires a trait matrix (e.g., leaf size, wood density).
$$Q = \sum_{i=1}^{S} \sum_{j=1}^{S} d_{ij} p_i p_j$$
*   $d_{ij}$: Functional distance between species $i$ and $j$.
*   $p_i, p_j$: Relative abundance of species $i$ and $j$.
*   **Note**: $d_{ij}$ should be a distance metric (0 for identical). Normalize $Q$ if a 0-1 scale is needed.
