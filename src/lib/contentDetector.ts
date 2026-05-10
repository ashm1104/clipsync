export type ClipType = 'text' | 'rich_text' | 'code' | 'url' | 'image';

// Strong prefix signals — if a snippet starts with one of these, it's
// almost certainly code regardless of length or other heuristics.
const PREFIX_PATTERNS = [
  /^(def |class |import |from |async def )/m, // Python
  /^(const |let |var |function |export |async function )/m, // JS / TS
  /^(SELECT |INSERT |UPDATE |DELETE |CREATE )/im, // SQL
  /^(<[a-z][a-z0-9]*[\s>])/m, // HTML
  /^(\{|\[)/m, // JSON-ish
  /^(#include|#define|int main)/m, // C / C++
  /^(public class|private |protected )/m, // Java
  /^(fn |use |let mut|impl )/m, // Rust
  /^(package |func |import ")/m, // Go
];

// Statistical signals for snippets that don't start with a keyword.
// Each true signal counts toward the threshold.
function codeSignalCount(text: string): number {
  let n = 0;

  // Variable / property assignment, e.g. `x = ...`, `foo: bar`, `obj.x = 1`.
  // Excludes "x = yes/no/true/false standalone" prose.
  if (/^[\w$.]+\s*[=:]\s*\S/m.test(text) &&
      !/^[\w$.]+\s*=\s+(yes|no)\.?\s*$/im.test(text)) n++;

  // Function / method call: identifier followed by parentheses with content.
  if (/\b[\w$]+\([^)]*\)/.test(text)) n++;

  // Arrow function, pointer, lambda keyword, scope resolution.
  if (/=>|->|\blambda\b|::/.test(text)) n++;

  // Comparison or logical operators that are very rare in prose.
  if (/[!=<>]==?|&&|\|\||\+\+|--/.test(text)) n++;

  // Braces / brackets actually used (not just a single decorative one).
  if (/[{}\[\]]/g.test(text) && (text.match(/[{}\[\]]/g) || []).length >= 2) n++;

  // Semicolon line-endings, a strong code tell when not in normal sentences.
  if (/;\s*\n|;\s*$/.test(text) && !/[.!?]\s/.test(text)) n++;

  // Single-line comment markers.
  if (/^\s*(\/\/|#|--|\/\*)/m.test(text)) n++;

  // Code-symbol density. Real code spends a lot of bytes on punctuation.
  const symbols = (text.match(/[{}\[\]()=<>!&|+\-*/%;:]/g) || []).length;
  if (symbols / Math.max(text.length, 1) > 0.1) n++;

  return n;
}

export function detectType(text: string, hasHtmlFormatting: boolean): ClipType {
  const trimmed = text.trim();

  // URL detection — has to win over code (a bare URL has lots of /:?=).
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') return 'url';
  } catch {
    // not a URL
  }

  if (hasHtmlFormatting) return 'rich_text';

  // Strong prefix → always code.
  if (PREFIX_PATTERNS.some((p) => p.test(trimmed))) return 'code';

  // Multi-line + indented blocks are almost always code.
  const indentedLines = (trimmed.match(/\n {2,}/g) || []).length;
  if (indentedLines > 2) return 'code';

  // Statistical fallback — needs at least 2 strong code signals AND
  // some minimum length so we don't misclassify "x = 5".
  if (trimmed.length >= 12 && codeSignalCount(trimmed) >= 2) return 'code';

  return 'text';
}

// Language guess. Multi-signal scoring beats single-keyword matching
// for snippets that don't start with the obvious cue.
export function detectLanguage(code: string): string {
  const score = (patterns: RegExp[]): number => patterns.filter((p) => p.test(code)).length;

  const python = score([
    /\b(import|from)\s+\w+/,
    /\bdef\s+\w+\(/,
    /\bclass\s+\w+\s*[(:]/,
    /\blambda\b/,
    /\bprint\s*\(/,
    /\brange\s*\(/,
    /\bself\b/,
    /\bNone\b|\bTrue\b|\bFalse\b/,
    /:\s*$/m, // line ending with colon (block opener)
    /\b__\w+__\b/, // dunder
  ]);

  const ts = score([
    /\b(interface|type)\s+\w+\s*[={]/,
    /:\s*(string|number|boolean|any|unknown|void|never)\b/,
    /\bas\s+(string|number|boolean|any|unknown)\b/,
    /\bimport\s+.*\bfrom\s+['"]/,
  ]);

  const js = score([
    /\bconsole\.\w+\(/,
    /=>\s*[{({]/,
    /\b(const|let|var)\s+\w+/,
    /\bfunction\s*\*?\s*\w*\(/,
    /\b(null|undefined)\b/,
    /\b(await|async)\b/,
    /;\s*$/m,
  ]);

  const sql = score([
    /\b(SELECT|FROM|WHERE|JOIN|GROUP\s+BY|ORDER\s+BY)\b/i,
    /\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i,
    /\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|VIEW)\b/i,
  ]);

  const html = score([
    /<\/[a-z]+>/i,
    /<[a-z]+[^>]*>/i,
    /<!DOCTYPE/i,
  ]);

  const json = score([
    /^\s*[{[]/,
    /:\s*("|true|false|null|\d)/,
    /,\s*\n\s*"/,
  ]);

  const cpp = score([
    /#include\s*[<"]/,
    /\bstd::/,
    /\bint\s+main\b/,
    /\bnullptr\b/,
  ]);

  const java = score([
    /\b(public|private|protected)\s+(class|static)\b/,
    /\bSystem\.out\./,
    /\bnew\s+[A-Z]\w*\(/,
  ]);

  const rust = score([
    /\bfn\s+\w+\s*\(/,
    /\blet\s+mut\b/,
    /\bimpl\s+/,
    /->\s*Result</,
  ]);

  const go = score([
    /\bpackage\s+\w+/,
    /\bfunc\s+\w+\s*\(/,
    /\bfmt\.Print/,
  ]);

  const css = score([
    /^[.#@]?[\w-]+\s*\{/m,
    /:\s*\d+(px|em|rem|%|vh|vw)\b/,
    /\b(color|background|margin|padding):/,
  ]);

  const bash = score([
    /^\s*#!/,
    /\b(echo|grep|awk|sed|cat|find)\b/,
    /\$\{?\w+\}?/,
  ]);

  const candidates: Array<[string, number]> = [
    ['python', python],
    ['typescript', ts],
    ['javascript', js],
    ['sql', sql],
    ['html', html],
    ['json', json],
    ['cpp', cpp],
    ['java', java],
    ['rust', rust],
    ['go', go],
    ['css', css],
    ['bash', bash],
  ];

  candidates.sort((a, b) => b[1] - a[1]);
  if (candidates[0][1] >= 2) return candidates[0][0];

  // Fallback to original prefix-based guess.
  if (/^(def |class |import |from )/.test(code)) return 'python';
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE)/i.test(code)) return 'sql';
  if (/^<[a-z]/.test(code)) return 'html';
  if (/^(\{|\[)/.test(code)) return 'json';
  if (/^(const |let |var |function )/.test(code)) return 'javascript';
  if (/^(import |export |interface |type )/.test(code)) return 'typescript';
  if (/^(#include|int main)/.test(code)) return 'cpp';
  if (/^(public class|private )/.test(code)) return 'java';
  if (/^(fn |use |impl )/.test(code)) return 'rust';
  if (/^(package |func )/.test(code)) return 'go';
  return 'plaintext';
}

// Public list of languages users can pick from when overriding the
// auto-detection. Order is "popular at the top". Maps to Shiki language
// IDs so highlighting works directly.
export const SUPPORTED_LANGUAGES: { id: string; label: string }[] = [
  { id: 'plaintext', label: 'Plain text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
  { id: 'yaml', label: 'YAML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C / C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'php', label: 'PHP' },
  { id: 'swift', label: 'Swift' },
  { id: 'kotlin', label: 'Kotlin' },
];
