export type ClipType = 'text' | 'rich_text' | 'code' | 'url' | 'image';

const CODE_PATTERNS = [
  /^(def |class |import |from |async def )/m,
  /^(const |let |var |function |import |export )/m,
  /^(SELECT |INSERT |UPDATE |DELETE |CREATE )/im,
  /^(<[a-z][a-z0-9]*[\s>])/m,
  /^(\{|\[)/m,
  /^(#include|#define|int main)/m,
  /^(public class|private |protected )/m,
  /^(fn |use |let mut|impl )/m,
  /^(package |func |import ")/m,
];

export function detectType(text: string, hasHtmlFormatting: boolean): ClipType {
  try {
    const url = new URL(text.trim());
    if (url.protocol === 'http:' || url.protocol === 'https:') return 'url';
  } catch {
    // not a URL
  }

  if (hasHtmlFormatting) return 'rich_text';

  const trimmed = text.trim();
  const isCode = CODE_PATTERNS.some((p) => p.test(trimmed));
  const hasConsistentIndentation = (trimmed.match(/\n {2,}/g) || []).length > 2;
  if (isCode || (hasConsistentIndentation && trimmed.includes('\n'))) return 'code';

  return 'text';
}

export function detectLanguage(code: string): string {
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
