/**
 * PepRep — Compound Reference Data (seed)
 * =======================================
 *
 * SCOPE: Identity and measurement context ONLY.
 *
 * This file contains no dosing recommendations, no dose ranges, no protocols,
 * no cycles, no stacks, no efficacy claims, no vendors and no prices — by design.
 * Those fields do not exist in the `Compound` type and must never be added.
 *
 * SOURCING PROVENANCE (2026-07-17)
 * --------------------------------
 * Every `molecularWeightDa`, `molecularFormula` and `pubchemCid` below was fetched
 * directly from the PubChem PUG REST API and independently confirmed. They are NOT
 * recalled from model memory and NOT taken from search snippets.
 *
 * Fields NOT yet sourced — halfLife, storageNotes, regulatoryStatus,
 * commonLabelVialSizes, and most structuralClass values — carry NOT_ESTABLISHED.
 * This is deliberate and honest: absence of data is reported as absence of data.
 * They require a second sourcing pass against FDA/EMA/TGA labels and PubMed.
 * DO NOT fill them from memory. DO NOT replace NOT_ESTABLISHED with a dash.
 *
 * TWO NAME-COLLISION TRAPS CAUGHT DURING SOURCING — do not "correct" these back:
 *  1. KPV: a naive PubChem name lookup returns CID 13294447 (192.21 Da, C11H12O3) —
 *     that is 2-oxo-5-phenylpentanoic acid, an unrelated organic acid carrying "KPV"
 *     as a synonym. It has ZERO nitrogen atoms and therefore cannot be a peptide.
 *     The correct Lys-Pro-Val tripeptide is CID 125672, 342.43 Da, C16H30N4O4.
 *  2. TB-500 is NOT thymosin beta-4. PubChem CID 62707662 resolves TB-500 to
 *     Ac-Leu-Lys-Lys-Thr-Glu-Thr-Gln-OH — an acetylated 7-mer, 889.0 Da. Full
 *     thymosin beta-4 is CID 45382195, 4963 Da. Both are listed separately below.
 *
 * Retatrutide is absent from PubChem under "Retatrutide", "LY3437943" and
 * "LY-3437943" (checked). Its identity fields are NOT_ESTABLISHED.
 */

export const NOT_ESTABLISHED = 'not established' as const;

export interface Citation {
  label: string;
  url: string;
}

export interface Compound {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  structuralClass: string;
  identityLine: string;
  molecularWeightDa: string;
  pubchemCid: string;
  molecularFormula: string;
  sequenceLength: string;
  halfLife: string;
  massUnitConvention: 'mcg' | 'mg' | 'unclear';
  commonLabelVialSizes: string[];
  storageNotes: string;
  regulatoryStatus: string;
  citations: Citation[];
  fieldsNotEstablished: string[];
  verified: boolean;
  dataset: 'personal' | 'demo';
}

const pubchem = (cid: string): Citation => ({
  label: `PubChem CID ${cid}`,
  url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
});

/** Fields awaiting a second sourcing pass against regulator labels / PubMed. */
const UNSOURCED = [
  'halfLife',
  'storageNotes',
  'regulatoryStatus',
  'commonLabelVialSizes',
  'massUnitConvention',
];

export const COMPOUNDS: Compound[] = [
  {
    id: 'cmp_bpc157',
    slug: 'bpc-157',
    name: 'BPC-157',
    fullName: 'Body Protection Compound 157',
    structuralClass: 'Pentadecapeptide',
    identityLine: 'A synthetic peptide of 15 amino acids.',
    molecularWeightDa: '1419.5',
    pubchemCid: '9941957',
    molecularFormula: 'C62H98N16O22',
    sequenceLength: '15 amino acids',
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('9941957')],
    fieldsNotEstablished: UNSOURCED,
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_tb500',
    slug: 'tb-500',
    name: 'TB-500',
    fullName: 'Ac-Leu-Lys-Lys-Thr-Glu-Thr-Gln-OH',
    structuralClass: 'Acetylated heptapeptide',
    identityLine:
      'An acetylated 7-amino-acid peptide. Distinct from thymosin beta-4, which is a separate, much larger molecule.',
    molecularWeightDa: '889.0',
    pubchemCid: '62707662',
    molecularFormula: 'C38H68N10O14',
    sequenceLength: '7 amino acids',
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('62707662')],
    fieldsNotEstablished: UNSOURCED,
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_tb4',
    slug: 'thymosin-beta-4',
    name: 'Thymosin beta-4',
    fullName: 'Thymosin beta-4',
    structuralClass: 'Peptide',
    identityLine:
      'A peptide listed separately from TB-500; the two are different molecules and are frequently conflated.',
    molecularWeightDa: '4963',
    pubchemCid: '45382195',
    molecularFormula: 'C212H350N56O78S',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('45382195')],
    fieldsNotEstablished: [...UNSOURCED, 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_kpv',
    slug: 'kpv',
    name: 'KPV',
    fullName: 'L-lysyl-L-prolyl-L-valine',
    structuralClass: 'Tripeptide',
    identityLine: 'A tripeptide composed of lysine, proline and valine.',
    molecularWeightDa: '342.43',
    pubchemCid: '125672',
    molecularFormula: 'C16H30N4O4',
    sequenceLength: '3 amino acids',
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('125672')],
    fieldsNotEstablished: UNSOURCED,
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_ta1',
    slug: 'thymosin-alpha-1',
    name: 'Thymosin alpha-1',
    fullName: 'Thymosin alpha-1',
    structuralClass: 'Peptide',
    identityLine: 'A peptide originally characterised from thymic tissue.',
    molecularWeightDa: '3108.3',
    pubchemCid: '16130571',
    molecularFormula: 'C129H215N33O55',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('16130571')],
    fieldsNotEstablished: [...UNSOURCED, 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_cjc1295',
    slug: 'cjc-1295',
    name: 'CJC-1295',
    fullName: 'CJC-1295',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '3647.2',
    pubchemCid: '91971820',
    molecularFormula: 'C165H269N47O46',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('91971820')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_ipamorelin',
    slug: 'ipamorelin',
    name: 'Ipamorelin',
    fullName: 'Ipamorelin',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '711.9',
    pubchemCid: '9831659',
    molecularFormula: 'C38H49N9O5',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('9831659')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_sermorelin',
    slug: 'sermorelin',
    name: 'Sermorelin',
    fullName: 'Sermorelin',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '3357.9',
    pubchemCid: '16132413',
    molecularFormula: 'C149H246N44O42S',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('16132413')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_tesamorelin',
    slug: 'tesamorelin',
    name: 'Tesamorelin',
    fullName: 'Tesamorelin',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '5136',
    pubchemCid: '16137828',
    molecularFormula: 'C221H366N72O67S',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('16137828')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_semaglutide',
    slug: 'semaglutide',
    name: 'Semaglutide',
    fullName: 'Semaglutide',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '4114',
    pubchemCid: '56843331',
    molecularFormula: 'C187H291N45O59',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('56843331')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_tirzepatide',
    slug: 'tirzepatide',
    name: 'Tirzepatide',
    fullName: 'Tirzepatide',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '4813',
    pubchemCid: '166567236',
    molecularFormula: 'C225H348N48O68',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('166567236')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_retatrutide',
    slug: 'retatrutide',
    name: 'Retatrutide',
    fullName: NOT_ESTABLISHED,
    structuralClass: NOT_ESTABLISHED,
    identityLine:
      'Not present in PubChem under "Retatrutide", "LY3437943" or "LY-3437943" as of 2026-07-17. Identity fields require a non-PubChem primary source.',
    molecularWeightDa: NOT_ESTABLISHED,
    pubchemCid: NOT_ESTABLISHED,
    molecularFormula: NOT_ESTABLISHED,
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [],
    fieldsNotEstablished: [
      ...UNSOURCED,
      'fullName',
      'structuralClass',
      'molecularWeightDa',
      'pubchemCid',
      'molecularFormula',
      'sequenceLength',
    ],
    verified: false,
    dataset: 'personal',
  },
  {
    id: 'cmp_cagrilintide',
    slug: 'cagrilintide',
    name: 'Cagrilintide',
    fullName: 'Cagrilintide',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '4409',
    pubchemCid: '171397054',
    molecularFormula: 'C194H312N54O59S2',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('171397054')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_ghkcu',
    slug: 'ghk-cu',
    name: 'GHK-Cu',
    fullName: 'Gly-His-Lys-Cu(II) (copper tripeptide)',
    structuralClass: 'Tripeptide copper(II) complex',
    identityLine:
      'A copper(II) complex of the tripeptide glycyl-histidyl-lysine. The uncomplexed tripeptide GHK is a separate entry (PubChem CID 73587, 340.38 Da).',
    molecularWeightDa: '400.90',
    pubchemCid: '139035031',
    molecularFormula: 'C14H21CuN6O4-',
    sequenceLength: '3 amino acids',
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('139035031'), pubchem('73587')],
    fieldsNotEstablished: UNSOURCED,
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_semax',
    slug: 'semax',
    name: 'Semax',
    fullName: 'Semax',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '813.9',
    pubchemCid: '9811102',
    molecularFormula: 'C37H51N9O10S',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('9811102')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_selank',
    slug: 'selank',
    name: 'Selank',
    fullName: 'Selank',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '751.9',
    pubchemCid: '11765600',
    molecularFormula: 'C33H57N11O9',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('11765600')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_dsip',
    slug: 'dsip',
    name: 'DSIP',
    fullName: 'Delta sleep-inducing peptide',
    structuralClass: 'Peptide',
    identityLine: 'A peptide originally characterised in sleep research.',
    molecularWeightDa: '848.8',
    pubchemCid: '68816',
    molecularFormula: 'C35H48N10O15',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('68816')],
    fieldsNotEstablished: [...UNSOURCED, 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_mk677',
    slug: 'mk-677',
    name: 'MK-677',
    fullName: 'Ibutamoren',
    structuralClass: 'Non-peptide small molecule',
    identityLine:
      'A non-peptide small molecule. Unlike the peptides in this reference, it is not reconstituted from lyophilised powder in the same way.',
    molecularWeightDa: '528.7',
    pubchemCid: '178024',
    molecularFormula: 'C27H36N4O5S',
    sequenceLength: 'not applicable (not a peptide)',
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('178024')],
    fieldsNotEstablished: UNSOURCED,
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_aod9604',
    slug: 'aod-9604',
    name: 'AOD-9604',
    fullName: 'AOD-9604',
    structuralClass: NOT_ESTABLISHED,
    identityLine: 'A synthetic peptide.',
    molecularWeightDa: '1815.1',
    pubchemCid: '71300630',
    molecularFormula: 'C78H123N23O23S2',
    sequenceLength: NOT_ESTABLISHED,
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('71300630')],
    fieldsNotEstablished: [...UNSOURCED, 'structuralClass', 'sequenceLength'],
    verified: true,
    dataset: 'personal',
  },
  {
    id: 'cmp_epitalon',
    slug: 'epitalon',
    name: 'Epitalon',
    fullName: 'Epitalon (Epithalon)',
    structuralClass: 'Tetrapeptide',
    identityLine: 'A synthetic peptide of four amino acids.',
    molecularWeightDa: '390.35',
    pubchemCid: '219042',
    molecularFormula: 'C14H22N4O9',
    sequenceLength: '4 amino acids',
    halfLife: NOT_ESTABLISHED,
    massUnitConvention: 'unclear',
    commonLabelVialSizes: [],
    storageNotes: NOT_ESTABLISHED,
    regulatoryStatus: NOT_ESTABLISHED,
    citations: [pubchem('219042')],
    fieldsNotEstablished: UNSOURCED,
    verified: true,
    dataset: 'personal',
  },
];

export function getCompoundBySlug(slug: string): Compound | undefined {
  const needle = slug.trim().toLowerCase();
  if (needle === '') return undefined;
  return COMPOUNDS.find((c) => c.slug.toLowerCase() === needle);
}

export function searchCompounds(query: string): Compound[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...COMPOUNDS];
  return COMPOUNDS.filter((c) =>
    [c.name, c.fullName, c.slug, c.structuralClass, c.identityLine]
      .join(' ')
      .toLowerCase()
      .includes(needle)
  );
}
