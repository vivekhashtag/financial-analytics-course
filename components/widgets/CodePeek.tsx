'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { detectLang, tokenize, TOKEN_CLASS, type Token } from '@/lib/highlight';

export interface CodeAnnotation {
  /** the exact substring in the snippet this note is about */
  text: string;
  note: string;
}

interface CodePeekProps {
  code: string;
  lang?: string;
  title?: string;
  filename?: string;
  annotations?: CodeAnnotation[];
  /** off by default: most snippets are 3–8 lines and numbers add noise */
  showLineNumbers?: boolean;
}

interface PinnedToken extends Token {
  pin?: number;
}

const LANG_LABEL: Record<string, string> = {
  python: 'Python',
  sql: 'SQL',
  bash: 'Terminal',
  text: 'Output',
};

/**
 * Read-only syntax-highlighted snippet with a copy button, and optional
 * annotation pins that point at exact substrings (`<CodePeek annotations={…} />`
 * in Module 2's "how to read a line of code").
 */
export function CodePeek({
  code,
  lang,
  title,
  filename,
  annotations,
  showLineNumbers = false,
}: CodePeekProps) {
  const [copied, setCopied] = useState(false);
  const source = code.replace(/\n+$/, '');

  const language = useMemo(() => detectLang(source, lang), [source, lang]);
  const lines = useMemo(
    () => applyPins(tokenize(source, language), annotations ?? []),
    [source, language, annotations],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const heading = title ?? filename;

  return (
    <figure className="widget not-prose overflow-hidden rounded-md border border-border bg-[#FBFCFE] shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="chip bg-surface-alt text-muted">{LANG_LABEL[language] ?? language}</span>
          {heading && (
            <span className="truncate font-mono text-xs text-muted">{heading}</span>
          )}
        </div>
        <button
          type="button"
          onClick={copy}
          className="btn-ghost -mr-1 px-2 py-1 text-xs"
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          <Icon name={copied ? 'check' : 'copy'} size={14} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* `em`-relative so the snippet scales with whatever it sits in:
          content prose (font.prose) or UI panels (text-base). */}
      <pre className="overflow-x-auto px-4 py-3 text-[0.9em] leading-[1.7]">
        <code className="font-mono">
          {lines.map((tokens, i) => (
            <span key={i} className="block min-h-[1.7em] whitespace-pre">
              {showLineNumbers && (
                <span className="mr-4 inline-block w-5 select-none text-right text-xs text-muted/60">
                  {i + 1}
                </span>
              )}
              {tokens.map((t, j) =>
                t.pin ? (
                  <span
                    key={j}
                    className="relative rounded-sm bg-primary/10 px-0.5 ring-1 ring-primary/30"
                  >
                    <span className={TOKEN_CLASS[t.kind]}>{t.value}</span>
                    <sup className="ml-0.5 font-body text-[10px] font-semibold text-primary">
                      {t.pin}
                    </sup>
                  </span>
                ) : (
                  <span key={j} className={TOKEN_CLASS[t.kind]}>
                    {t.value}
                  </span>
                ),
              )}
            </span>
          ))}
        </code>
      </pre>

      {annotations && annotations.length > 0 && (
        <figcaption className="border-t border-border bg-surface/60 px-4 py-3">
          <ol className="space-y-2">
            {annotations.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold tabular-nums text-white">
                  {i + 1}
                </span>
                <span className="text-ink">
                  <code className="rounded-sm bg-surface-alt px-1 py-0.5 font-mono text-xs">
                    {a.text}
                  </code>
                  <span className="mx-1.5 text-muted">—</span>
                  {a.note}
                </span>
              </li>
            ))}
          </ol>
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Splits the token that holds each annotation's target substring so the pin can
 * wrap exactly that text. Annotations are matched in order, and a token already
 * carrying a pin is never reused — that keeps `=` from landing inside a token
 * an earlier annotation already claimed.
 */
function applyPins(lines: Token[][], annotations: CodeAnnotation[]): PinnedToken[][] {
  const result: PinnedToken[][] = lines.map((line) => line.map((t) => ({ ...t })));

  annotations.forEach((annotation, index) => {
    if (!annotation?.text) return;

    for (const line of result) {
      for (let t = 0; t < line.length; t += 1) {
        const token = line[t];
        if (token.pin) continue;

        const at = token.value.indexOf(annotation.text);
        if (at === -1) continue;

        const before = token.value.slice(0, at);
        const match = token.value.slice(at, at + annotation.text.length);
        const after = token.value.slice(at + annotation.text.length);

        const replacement: PinnedToken[] = [];
        if (before) replacement.push({ kind: token.kind, value: before });
        replacement.push({ kind: token.kind, value: match, pin: index + 1 });
        if (after) replacement.push({ kind: token.kind, value: after });

        line.splice(t, 1, ...replacement);
        return;
      }
    }
  });

  return result;
}

/** MDX fenced code blocks route through here so they match `<CodePeek />`. */
export function MdxPre({ children }: { children?: React.ReactNode }) {
  const el = children as
    | { props?: { children?: string; className?: string } }
    | undefined;
  const raw = el?.props?.children;
  const className = el?.props?.className ?? '';
  const lang = /language-([\w-]+)/.exec(className)?.[1];

  if (typeof raw !== 'string') {
    return <pre>{children}</pre>;
  }
  return <CodePeek code={raw} lang={lang} />;
}
