/**
 * A small syntax highlighter for the four languages this course actually shows:
 * Python, SQL, bash and plain text.
 *
 * Why not a grammar library: the course's Python snippets use `//` as an
 * *output annotation* marker —
 *
 *     closes[0]     // 3450.75 - Python counts from ZERO
 *
 * — which every real Python grammar reads as floor division and colours as
 * code. The MDX is the spec, so the highlighter bends instead of the content.
 * Synchronous and dependency-free, so it runs in server and client components
 * alike.
 */

export type TokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'builtin'
  | 'number'
  | 'operator'
  | 'decorator'
  | 'function';

export interface Token {
  kind: TokenKind;
  value: string;
}

export type Lang = 'python' | 'sql' | 'bash' | 'text';

const PYTHON_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif',
  'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
  'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'True', 'False',
]);

const PYTHON_BUILTINS = new Set([
  'abs', 'all', 'any', 'bool', 'dict', 'enumerate', 'filter', 'float', 'format', 'int',
  'isinstance', 'len', 'list', 'map', 'max', 'min', 'open', 'print', 'range', 'reversed',
  'round', 'set', 'sorted', 'str', 'sum', 'tuple', 'type', 'zip', 'self',
]);

const SQL_KEYWORDS = new Set(
  (
    'select from where group by order having join left right inner outer full on as and or not ' +
    'null is in like between limit offset with union all distinct case when then else end over ' +
    'partition rank dense_rank row_number sum avg count min max coalesce cast asc desc insert ' +
    'into values update set delete create table view index primary key foreign references'
  ).split(' '),
);

const BASH_BUILTINS = new Set([
  'pip', 'python', 'python3', 'jupyter', 'streamlit', 'cd', 'ls', 'echo', 'export', 'npm',
  'node', 'git', 'conda', 'brew', 'install', 'run',
]);

/** Guesses the language from the snippet when the content does not say. */
export function detectLang(code: string, declared?: string): Lang {
  const d = (declared ?? '').toLowerCase();
  if (d === 'py' || d === 'python') return 'python';
  if (d === 'sql' || d === 'postgresql' || d === 'psql') return 'sql';
  if (d === 'bash' || d === 'sh' || d === 'shell' || d === 'console' || d === 'zsh') return 'bash';
  if (d === 'text' || d === 'txt' || d === 'plain' || d === 'output') return 'text';
  if (d) return 'text';

  if (/^\s*(SELECT|WITH|CREATE|INSERT|UPDATE|DELETE)\b/im.test(code)) return 'sql';
  if (/^\s*(pip|conda|jupyter|streamlit|git|npm|python3?)\s/m.test(code)) return 'bash';
  return 'python';
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*/;
const NUMBER = /^(?:0[xX][0-9a-fA-F_]+|\d[\d_]*\.?[\d_]*(?:[eE][+-]?\d+)?%?)/;
const OPERATOR = /^(?:\*\*|\/\/|[-+*/%<>=!]=|[-+*/%<>=!~^&|:,.;()[\]{}@]|->)/;
const WHITESPACE = /^\s+/;

/**
 * Tokenises one snippet. Multi-line strings are handled line-agnostically by
 * scanning the whole source, so triple-quoted docstrings colour correctly.
 */
export function tokenize(code: string, lang: Lang): Token[][] {
  const tokens: Token[] = [];
  let i = 0;
  const n = code.length;

  const push = (kind: TokenKind, value: string) => {
    if (!value) return;
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind) last.value += value;
    else tokens.push({ kind, value });
  };

  while (i < n) {
    const rest = code.slice(i);

    // Line comments. `//` counts as one because the course uses it that way.
    const commentStart =
      lang === 'sql'
        ? /^(--|\/\/)/.exec(rest)
        : lang === 'python' || lang === 'bash'
          ? /^(#|\/\/)/.exec(rest)
          : null;

    if (commentStart) {
      const end = code.indexOf('\n', i);
      const stop = end === -1 ? n : end;
      push('comment', code.slice(i, stop));
      i = stop;
      continue;
    }

    // Strings, including triple-quoted and f-string prefixes.
    const strMatch = /^([fFrRbBuU]{0,2})("""|'''|"|')/.exec(rest);
    if (strMatch) {
      const prefix = strMatch[1];
      const quote = strMatch[2];
      let j = i + prefix.length + quote.length;
      while (j < n) {
        if (code[j] === '\\') {
          j += 2;
          continue;
        }
        if (code.startsWith(quote, j)) {
          j += quote.length;
          break;
        }
        j += 1;
      }
      push('string', code.slice(i, Math.min(j, n)));
      i = Math.min(j, n);
      continue;
    }

    const ws = WHITESPACE.exec(rest);
    if (ws) {
      push('plain', ws[0]);
      i += ws[0].length;
      continue;
    }

    if (lang === 'python' && rest[0] === '@' && IDENT.test(rest.slice(1))) {
      const name = IDENT.exec(rest.slice(1))![0];
      push('decorator', '@' + name);
      i += name.length + 1;
      continue;
    }

    const num = NUMBER.exec(rest);
    if (num && /[\d]/.test(num[0][0])) {
      push('number', num[0]);
      i += num[0].length;
      continue;
    }

    const ident = IDENT.exec(rest);
    if (ident) {
      const word = ident[0];
      const after = code.slice(i + word.length);
      const isCall = /^\s*\(/.test(after);

      let kind: TokenKind = 'plain';
      if (lang === 'python') {
        if (PYTHON_KEYWORDS.has(word)) kind = 'keyword';
        else if (PYTHON_BUILTINS.has(word)) kind = 'builtin';
        else if (isCall) kind = 'function';
      } else if (lang === 'sql') {
        if (SQL_KEYWORDS.has(word.toLowerCase())) kind = 'keyword';
        else if (isCall) kind = 'function';
      } else if (lang === 'bash') {
        if (BASH_BUILTINS.has(word)) kind = 'builtin';
      }

      push(kind, word);
      i += word.length;
      continue;
    }

    const op = OPERATOR.exec(rest);
    if (op) {
      push('operator', op[0]);
      i += op[0].length;
      continue;
    }

    push('plain', rest[0]);
    i += 1;
  }

  // Re-split into lines so callers can render gutters and per-line pins.
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    const parts = token.value.split('\n');
    parts.forEach((part, idx) => {
      if (idx > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ kind: token.kind, value: part });
    });
  }
  return lines;
}

/** Token colours, drawn from the course palette so code matches the brand. */
export const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: 'text-ink',
  comment: 'text-muted italic',
  string: 'text-[#0D9488]',
  keyword: 'text-[#7C3AED] font-medium',
  builtin: 'text-[#2563EB]',
  function: 'text-[#0284C7]',
  number: 'text-[#DB2777]',
  operator: 'text-[#5B6B84]',
  decorator: 'text-[#EA580C]',
};
