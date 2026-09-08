import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-content px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted">404</p>
      <h1 className="mt-2 text-3xl font-bold text-ink">That page isn&apos;t in the course</h1>
      <p className="mt-3 text-muted">
        The module, page or dataset you asked for doesn&apos;t exist in the content package.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/modules" className="btn-primary no-underline">
          Browse the modules
        </Link>
        <Link href="/" className="btn-secondary no-underline">
          Back to the start
        </Link>
      </div>
    </div>
  );
}
