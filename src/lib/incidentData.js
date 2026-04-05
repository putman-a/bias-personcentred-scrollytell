import Papa from 'papaparse'

export const DOMAINS = [
  { key: '1. Discrimination and Toxicity',                  label: 'Discrimination & Toxicity',         color: '#4a9eff' },
  { key: '2. Privacy & Security',                           label: 'Privacy & Security',                color: '#e05c8a' },
  { key: '3. Misinformation',                               label: 'Misinformation',                    color: '#f0a030' },
  { key: '4. Malicious Actors & Misuse',                    label: 'Malicious Actors & Misuse',         color: '#e24b4a' },
  { key: '5. Human-Computer Interaction',                   label: 'Human-Computer Interaction',        color: '#2dcca0' },
  { key: '6. Socioeconomic & Environmental Harms',          label: 'Socioeconomic & Environmental',     color: '#9b7fe8' },
  { key: '7. AI system safety, failures, and limitations',  label: 'AI System Safety & Failures',       color: '#8a8f9e' },
  { key: 'NA',                                              label: 'Unclassified / Other',              color: '#50545e' },
];

/** @returns {Promise<{years: number[], yearDomain: Record<number, Record<string, number>>}>} */
export async function loadData() {
  const res = await fetch('/data/linked_incident_MIT_class.csv');
  const text = await res.text();

  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

  /** @type {Record<number, Record<string, number>>} */
  const yearDomain = {};

  data.forEach((row) => {
    const raw = row['date'] || '';
    const year = raw ? parseInt(raw.substring(0, 4)) : null;
    if (!year || year < 2000 || year > 2030) return;
    const domain = (row['Risk Domain'] || 'NA').trim() || 'NA';
    if (!yearDomain[year]) yearDomain[year] = {};
    yearDomain[year][domain] = (yearDomain[year][domain] || 0) + 1;
  });

  const years = Object.keys(yearDomain).map(Number).sort((a, b) => a - b);
  return { years, yearDomain, total: data.length };
}
