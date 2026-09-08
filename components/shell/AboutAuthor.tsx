import { LinkedInIcon } from '@/components/ui/InlineIcons';
import { AUTHOR } from '@/lib/links';

/** Home page only. Sits above the global footer. */
export function AboutAuthor() {
  return (
    <section className="mx-auto max-w-wide px-4 pb-4" aria-labelledby="about-author">
      <div className="card p-6">
        <h2 id="about-author" className="text-xl font-semibold text-ink">
          About the author
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold text-ink">{AUTHOR.name}</p>
          <a
            href={AUTHOR.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${AUTHOR.name} on LinkedIn`}
            className="-m-1 rounded-md p-1 text-muted transition-colors duration-fast ease-token hover:text-primary"
          >
            <LinkedInIcon size={16} />
          </a>
        </div>

        <p className="mt-2 max-w-content text-sm leading-relaxed text-muted">
          A strategy, data and analytics leader with 15+ years across BFSI, healthcare, education
          and FMCG. His work spans business analysis, market research, competitive intelligence and
          M&amp;A support, and increasingly the application of machine learning and generative AI to
          finance — predictive modelling, budgeting, risk analysis and customer insight. This course
          reflects that blend: traditional analytics discipline, modern AI awareness, and a focus on
          outcomes.
        </p>
      </div>
    </section>
  );
}
