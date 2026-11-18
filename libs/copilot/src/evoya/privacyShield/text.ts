import { TextSection } from '../types';

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const splitPrivacyText = (
  text: string,
  sections: TextSection[]
): TextSection[] => {
  const byString = new Map<string, TextSection>();
  for (const section of sections) {
    if (section.string && !byString.has(section.string.toLowerCase())) {
      byString.set(section.string.toLowerCase(), section);
    }
  }
  if (!byString.size) return [{ string: text }];

  const candidates = Array.from(byString.values()).sort(
    (a, b) => b.string.length - a.string.length
  );
  const pattern = new RegExp(
    candidates.map((section) => `(${escapeRegExp(section.string)})`).join('|'),
    'gi'
  );
  const result: TextSection[] = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index!;
    if (start > offset) result.push({ string: text.slice(offset, start) });
    const candidateIndex = match
      .slice(1)
      .findIndex((group) => group !== undefined);
    result.push({ ...candidates[candidateIndex], string: match[0] });
    offset = start + match[0].length;
  }
  if (offset < text.length) result.push({ string: text.slice(offset) });
  return result;
};
