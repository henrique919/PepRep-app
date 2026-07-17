/**
 * Ask corpus — compounds.ts identity fields + glossary only.
 * Never includes vials, doses, plans, history, or sites.
 */

import { COMPOUNDS, type Compound } from "../data/compounds";
import { GLOSSARY_ENTRIES } from "../data/glossary";

export interface CorpusChunk {
  id: string;
  kind: "compound" | "glossary";
  title: string;
  text: string;
}

function compoundChunk(compound: Compound): CorpusChunk {
  const lines = [
    `Name: ${compound.name}`,
    `Full name: ${compound.fullName}`,
    `Structural class: ${compound.structuralClass}`,
    `Identity: ${compound.identityLine}`,
    `Molecular weight (Da): ${compound.molecularWeightDa}`,
    `Formula: ${compound.molecularFormula}`,
    `PubChem CID: ${compound.pubchemCid}`,
    `Sequence length: ${compound.sequenceLength}`,
    `Half-life: ${compound.halfLife}`,
    `Mass unit convention: ${compound.massUnitConvention}`,
    `Storage: ${compound.storageNotes}`,
    `Regulatory status: ${compound.regulatoryStatus}`,
    `Verified: ${compound.verified ? "yes" : "no"}`,
  ];
  if (compound.citations.length > 0) {
    lines.push(
      `Citations: ${compound.citations.map((c) => `${c.label} (${c.url})`).join("; ")}`,
    );
  }
  return {
    id: `compound:${compound.slug}`,
    kind: "compound",
    title: compound.name,
    text: lines.join("\n"),
  };
}

/** Full static corpus (read-only). */
export function buildCorpus(): CorpusChunk[] {
  const compounds = COMPOUNDS.map(compoundChunk);
  const glossary = GLOSSARY_ENTRIES.map((entry) => ({
    id: `glossary:${entry.term.toLowerCase().replace(/\s+/g, "-")}`,
    kind: "glossary" as const,
    title: entry.term,
    text: `${entry.term}\n${entry.body}`,
  }));
  return [...compounds, ...glossary];
}

/** Lightweight retrieval: rank chunks by query token overlap. */
export function retrieveCorpus(query: string, limit = 6): CorpusChunk[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return buildCorpus().slice(0, limit);
  const tokens = needle.split(/[^a-z0-9+-]+/).filter((t) => t.length > 1);
  const scored = buildCorpus().map((chunk) => {
    const hay = `${chunk.title}\n${chunk.text}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (hay.includes(token)) score += 1;
    }
    if (hay.includes(needle)) score += 3;
    return { chunk, score };
  });
  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.chunk);
}

export function formatCorpusForPrompt(chunks: CorpusChunk[]): string {
  if (chunks.length === 0) {
    return "(No matching corpus entries. Answer only if the glossary/system rules suffice; otherwise say you do not have that in the reference set.)";
  }
  return chunks.map((chunk) => `### ${chunk.title}\n${chunk.text}`).join("\n\n");
}
