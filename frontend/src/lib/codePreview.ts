export interface TextFileInfo {
  language: string;
  label: string;
  extension?: string;
}

const languages: [string, string, string][] = [
  ['python', 'Python', 'py pyw pyi'],
  ['javascript', 'JavaScript', 'js mjs cjs jsx'],
  ['typescript', 'TypeScript', 'ts tsx mts cts'],
  ['xml', 'HTML', 'html htm'],
  ['css', 'CSS', 'css'],
  ['scss', 'SCSS', 'scss'],
  ['less', 'Less', 'less'],
  ['json', 'JSON', 'json jsonc jsonl ndjson'],
  ['xml', 'XML', 'xml xsd xsl xslt svg'],
  ['yaml', 'YAML', 'yaml yml'],
  ['sql', 'SQL', 'sql'],
  ['java', 'Java', 'java'],
  ['cpp', 'C++', 'cpp cc cxx hpp hh hxx h'],
  ['c', 'C', 'c'],
  ['csharp', 'C#', 'cs'],
  ['bash', 'Shell', 'sh bash zsh ksh'],
  ['powershell', 'PowerShell', 'ps1 psm1 psd1'],
  ['dos', 'Batch', 'bat cmd'],
  ['markdown', 'Markdown', 'md markdown'],
  ['ini', 'Config', 'ini cfg conf config properties toml env editorconfig'],
  ['plaintext', 'CSV', 'csv'],
  ['plaintext', 'TSV', 'tsv'],
  ['plaintext', 'Text', 'txt text log gitignore dockerignore lock'],
  ['go', 'Go', 'go'],
  ['rust', 'Rust', 'rs'],
  ['ruby', 'Ruby', 'rb'],
  ['php', 'PHP', 'php'],
  ['swift', 'Swift', 'swift'],
  ['kotlin', 'Kotlin', 'kt kts'],
  ['scala', 'Scala', 'scala'],
  ['lua', 'Lua', 'lua'],
  ['r', 'R', 'r'],
  ['perl', 'Perl', 'pl pm'],
  ['graphql', 'GraphQL', 'graphql gql'],
  ['xml', 'Component', 'vue svelte'],
  ['diff', 'Diff', 'diff patch']
];

const extensions = new Map<string, TextFileInfo>();
for (const [language, label, suffixes] of languages)
  for (const extension of suffixes.split(' '))
    extensions.set(extension, { language, label, extension });

export function codeBlockFileInfo(language = ''): TextFileInfo {
  const tag = language.trim().toLowerCase();
  const aliases: Record<string, string> = {
    'c++': 'cpp',
    'c#': 'csharp',
    shell: 'bash',
    shellscript: 'bash',
    plain: 'plaintext',
    raw: 'plaintext'
  };
  const normalized = aliases[tag] || tag;
  if (normalized === 'plaintext') return extensions.get('txt')!;
  const extension = extensions.get(normalized);
  if (extension) return extension;
  const match = languages.find(([name]) => name === normalized);
  if (match) return extensions.get(match[2].split(' ')[0])!;
  return {
    language: normalized || 'plaintext',
    label: tag || 'Text',
    extension: 'txt'
  };
}

export function textFileInfo({
  name = '',
  mime
}: {
  name?: string;
  mime?: string;
}): TextFileInfo | undefined {
  const basename = name.split(/[\\/]/).pop() || '';
  const extension = /\.([\w]+)$/i.exec(basename)?.[1].toLowerCase();
  if (extension && extensions.has(extension)) return extensions.get(extension);
  if (/^dockerfile(?:\.[\w.-]+)?$/i.test(basename))
    return { language: 'dockerfile', label: 'Dockerfile' };
  if (/^(?:makefile|gnumakefile)$/i.test(basename))
    return { language: 'makefile', label: 'Makefile' };
  if (/^\.env(?:\.[\w.-]+)?$/i.test(basename)) return extensions.get('env');
  if (/^(?:readme|licen[sc]e|changelog|authors|notice)$/i.test(basename))
    return { language: 'plaintext', label: 'Text' };
  const contentType = mime?.split(';')[0].trim().toLowerCase();
  if (!contentType) return;
  if (/^(?:application|text)\/(?:[\w.+-]+\+)?json$/.test(contentType))
    return { language: 'json', label: 'JSON' };
  if (/^(?:application|text|image)\/(?:[\w.+-]+\+)?xml$/.test(contentType))
    return { language: 'xml', label: 'XML' };
  const mimeLanguages: Record<string, string> = {
    'text/x-python': 'py',
    'application/x-python-code': 'py',
    'text/javascript': 'js',
    'application/javascript': 'js',
    'application/ecmascript': 'js',
    'text/ecmascript': 'js',
    'text/typescript': 'ts',
    'application/typescript': 'ts',
    'text/css': 'css',
    'text/html': 'html',
    'text/csv': 'csv',
    'text/tab-separated-values': 'tsv',
    'text/markdown': 'md',
    'text/x-markdown': 'md',
    'text/yaml': 'yaml',
    'application/yaml': 'yaml',
    'application/x-yaml': 'yaml',
    'text/x-yaml': 'yaml',
    'application/sql': 'sql',
    'application/x-sh': 'sh',
    'application/x-shellscript': 'sh'
  };
  const suffix = mimeLanguages[contentType];
  if (suffix) return extensions.get(suffix);
  if (contentType.startsWith('text/') && contentType !== 'text/rtf')
    return { language: 'plaintext', label: 'Text' };
}

// Limit rendered source, rather than creating a DOM node for every line in a
// potentially 25 MB download. The original file remains available to download.
export const MAX_SOURCE_BYTES = 1024 * 1024;
export const MAX_SOURCE_LINES = 10000;

export function decodeSource(data: ArrayBuffer) {
  const bytes = new Uint8Array(data);
  const encoding =
    bytes[0] === 255 && bytes[1] === 254
      ? 'utf-16le'
      : bytes[0] === 254 && bytes[1] === 255
        ? 'utf-16be'
        : 'utf-8';
  const decoder = new TextDecoder(encoding, { fatal: true });
  let text: string;
  try {
    text = decoder.decode(bytes.subarray(0, MAX_SOURCE_BYTES), {
      stream: bytes.length > MAX_SOURCE_BYTES
    });
  } catch {
    throw new Error(
      'This file is not UTF-8 or UTF-16 text. Download the original to open it.'
    );
  }
  if (/[\u0000-\u0008\u000b\u000e-\u001f]/.test(text))
    throw new Error(
      'This appears to be a binary file. Download the original instead.'
    );
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const truncated =
    bytes.length > MAX_SOURCE_BYTES || lines.length > MAX_SOURCE_LINES;
  const visible = lines.slice(0, MAX_SOURCE_LINES);
  return {
    text: visible.join('\n'),
    lines: visible.length,
    truncated,
    encoding
  };
}
