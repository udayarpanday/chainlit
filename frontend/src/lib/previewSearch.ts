export interface TextMatch {
  start: number;
  end: number;
  index: number;
}
export const maxSearchMatches = 1000;
export function textMatches(
  text: string,
  query: string,
  limit = maxSearchMatches
): TextMatch[] {
  if (!query) return [];
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu');
  const matches: TextMatch[] = [];
  let match: RegExpExecArray | null;
  while (matches.length < limit && (match = regex.exec(text)))
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      index: matches.length
    });
  return matches;
}
export function escapeSource(text: string) {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!
  );
}
export function markedText(text: string, matches: TextMatch[], offset = 0) {
  let html = '',
    position = 0;
  for (const match of matches) {
    const start = Math.max(0, match.start - offset),
      end = Math.min(text.length, match.end - offset);
    if (end <= start) continue;
    html +=
      escapeSource(text.slice(position, start)) +
      '<mark class="preview-find-match" data-preview-match="' +
      match.index +
      '">' +
      escapeSource(text.slice(start, end)) +
      '</mark>';
    position = end;
  }
  return html + escapeSource(text.slice(position));
}
export function markHighlightedSource(html: string, matches: TextMatch[]) {
  if (!matches.length) return html;
  const host = document.createElement('div');
  host.innerHTML = html;
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  let offset = 0,
    matchIndex = 0;
  for (const node of nodes) {
    const end = offset + node.data.length;
    while (matchIndex < matches.length && matches[matchIndex].end <= offset)
      matchIndex++;
    const overlaps: TextMatch[] = [];
    for (
      let index = matchIndex;
      index < matches.length && matches[index].start < end;
      index++
    )
      overlaps.push(matches[index]);
    if (overlaps.length) {
      const span = document.createElement('template');
      span.innerHTML = markedText(node.data, overlaps, offset);
      node.replaceWith(span.content);
    }
    offset = end;
  }
  return host.innerHTML;
}
