'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-content px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-ink">Something broke rendering this page</h1>
      <p className="mt-3 text-muted">
        This is a bug in the app, not in your browser. Try again, and if it persists the page&apos;s
        MDX or JSON is likely malformed.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
