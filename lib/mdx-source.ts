/**
 * Prepares a raw MDX body for compilation. Two problems to solve, both of them
 * the app bending so the content doesn't have to.
 *
 * 1. **Stray `<`.** MDX reads a bare `<` as the start of a tag. Pages contain
 *    prose like `P(NPV<0)` — valid Markdown, invalid MDX — so those get
 *    escaped. Fenced blocks, inline code, JSX tags and JSX expressions are
 *    left exactly as written.
 *
 * 2. **Code indentation.** MDX's expression parser strips two leading spaces
 *    from every continuation line of a multi-line template literal, so
 *    ``<CodePeek code={`for t in x:\n    total += 1`} />`` reaches the
 *    component with two-space indentation. On a module that tells learners
 *    "four spaces, consistently" that is not cosmetic. So `code={`…`}` props
 *    are lifted out of the source *before* MDX sees them and passed to the
 *    component by index, byte for byte.
 */

export interface PreparedMdx {
  /** MDX body safe to compile */
  body: string;
  /** verbatim `code={`…`}` prop values, indexed by `codeIndex` */
  codeBlocks: string[];
}

export function prepareMdx(raw: string): PreparedMdx {
  const fenced = fenceMask(raw);
  const { body, codeBlocks } = liftCodeProps(raw, fenced);
  return { body: escapeStrayAngles(body), codeBlocks };
}

/* ------------------------------------------------------- fenced-code mask */

/** Per-character flag: is this offset inside a ``` or ~~~ fenced block? */
function fenceMask(src: string): boolean[] {
  const mask = new Array<boolean>(src.length).fill(false);
  let fenceChar: string | null = null;
  let offset = 0;

  for (const line of src.split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    const isFenceLine = !!marker;

    if (isFenceLine) {
      if (fenceChar === null) fenceChar = marker[1][0];
      else if (marker[1][0] === fenceChar) fenceChar = null;
    }

    // Fence delimiters count as inside, so nothing rewrites them either.
    const inside = fenceChar !== null || isFenceLine;
    if (inside) {
      for (let i = 0; i < line.length; i += 1) mask[offset + i] = true;
    }
    offset += line.length + 1;
  }

  return mask;
}

/* ------------------------------------------------------- code prop lifting */

const CODE_ATTR = 'code={`';

function liftCodeProps(src: string, fenced: boolean[]): PreparedMdx {
  const codeBlocks: string[] = [];
  let out = '';
  let i = 0;

  while (i < src.length) {
    const at = src.indexOf(CODE_ATTR, i);

    // Must be a real attribute: preceded by whitespace, outside a code fence.
    if (at === -1 || fenced[at] || (at > 0 && !/\s/.test(src[at - 1]))) {
      if (at === -1) {
        out += src.slice(i);
        break;
      }
      out += src.slice(i, at + CODE_ATTR.length);
      i = at + CODE_ATTR.length;
      continue;
    }

    const start = at + CODE_ATTR.length;
    const end = findTemplateEnd(src, start);

    // Unterminated literal: leave the source alone and let MDX report it.
    if (end === -1 || src[end + 1] !== '}') {
      out += src.slice(i, start);
      i = start;
      continue;
    }

    out += src.slice(i, at);
    out += `codeIndex={${codeBlocks.length}}`;
    codeBlocks.push(unescapeTemplate(src.slice(start, end)));
    i = end + 2;
  }

  return { body: out, codeBlocks };
}

/** Index of the backtick closing a template literal that starts at `from`. */
function findTemplateEnd(src: string, from: number): number {
  for (let i = from; i < src.length; i += 1) {
    if (src[i] === '\\') {
      i += 1;
      continue;
    }
    if (src[i] === '`') return i;
  }
  return -1;
}

/** Applies the escapes a JS template literal would have resolved. */
function unescapeTemplate(text: string): string {
  return text.replace(/\\([`$\\])/g, '$1');
}

/* ------------------------------------------------------------- `<` escaping */

type Mode = 'markdown' | 'tag' | 'expression';

export function escapeStrayAngles(src: string): string {
  const fenced = fenceMask(src);

  let out = '';
  let mode: Mode = 'markdown';
  let depth = 0;
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (fenced[i]) {
      out += ch;
      i += 1;
      continue;
    }

    if (mode === 'markdown') {
      // Inline code spans pass through verbatim.
      if (ch === '`') {
        const ticks = /^`+/.exec(src.slice(i))![0];
        const lineEnd = src.indexOf('\n', i);
        const limit = lineEnd === -1 ? src.length : lineEnd;
        const close = src.indexOf(ticks, i + ticks.length);

        if (close !== -1 && close < limit) {
          out += src.slice(i, close + ticks.length);
          i = close + ticks.length;
          continue;
        }
      }

      if (ch === '<') {
        const next = src[i + 1];
        if (next && /[A-Za-z/!>]/.test(next)) {
          mode = 'tag';
          out += ch;
          i += 1;
          continue;
        }
        // Cannot begin a tag, a closing tag, a comment or a fragment.
        out += '&lt;';
        i += 1;
        continue;
      }

      out += ch;
      i += 1;
      continue;
    }

    if (mode === 'tag') {
      if (ch === '{') {
        mode = 'expression';
        depth = 1;
        out += ch;
        i += 1;
        continue;
      }
      if (ch === '"' || ch === "'") {
        const end = skipQuoted(src, i);
        out += src.slice(i, end);
        i = end;
        continue;
      }
      if (ch === '>') {
        mode = 'markdown';
        out += ch;
        i += 1;
        continue;
      }
      out += ch;
      i += 1;
      continue;
    }

    // mode === 'expression'
    if (ch === '`' || ch === '"' || ch === "'") {
      const end = skipQuoted(src, i);
      out += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) mode = 'tag';
    }
    out += ch;
    i += 1;
  }

  return out;
}

/** Index just past the closing quote (or backtick) of the string at `from`. */
function skipQuoted(src: string, from: number): number {
  const quote = src[from];
  for (let i = from + 1; i < src.length; i += 1) {
    if (src[i] === '\\') {
      i += 1;
      continue;
    }
    if (src[i] === quote) return i + 1;
    // An unterminated '"' or "'" must not swallow the rest of the document.
    if (quote !== '`' && src[i] === '\n') return i;
  }
  return src.length;
}
