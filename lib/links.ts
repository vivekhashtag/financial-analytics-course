/** External destinations, in one place so a URL change is a one-line edit. */

export const AUTHOR = {
  name: 'Vivek Dhandapani',
  linkedIn: 'https://www.linkedin.com/in/vivekdhandapani',
} as const;

/**
 * The introductory ML course this one hands off to at its border.
 *
 * Deliberately *not* "the sequel": this is an intro, and a deeper Machine
 * Learning & Deep Learning course is planned separately. Keep the copy in
 * `MlNextStepCard` aligned with that.
 */
export const ML_INTRO_URL = 'https://machinelearning-by-vivek.vercel.app/modules/intro-to-ml';
export const ML_INTRO_TITLE = 'Introduction to Machine Learning';

/**
 * The one place the hand-off card renders: Lesson 6.7, the signpost Module 6's
 * prose promises. Hard-scoped rather than content-detected so it cannot
 * reappear on other pages that happen to mention the border.
 */
export const ML_SIGNPOST_PAGE = { moduleId: '06-predictive', slug: 'content' } as const;

export type CourseIconName = 'network' | 'spark' | 'chain' | 'curve' | 'bars';

export interface RelatedCourse {
  title: string;
  description: string;
  href: string;
  icon: CourseIconName;
}

export const MORE_COURSES: RelatedCourse[] = [
  {
    // Title and copy track ML_INTRO_TITLE — this is the intro course, not a sequel.
    title: ML_INTRO_TITLE,
    description: 'Picks up where this course stops: models that learn from data.',
    href: ML_INTRO_URL,
    icon: 'network',
  },
  {
    title: 'Generative AI',
    description: 'LLMs, prompting, and building with generative models.',
    href: 'https://genai-by-vivek.vercel.app/',
    icon: 'spark',
  },
  {
    title: 'Blockchain',
    description: 'Distributed ledgers and digital assets, explained.',
    href: 'https://blockchain-by-vivek.vercel.app/',
    icon: 'chain',
  },
  {
    title: 'Mathematics Dashboard',
    description: 'Interactive mathematics explorations (Streamlit).',
    href: 'https://mathematicsdashboard-vivekdhandapani.streamlit.app/',
    icon: 'curve',
  },
  {
    title: 'Statistics Dashboard',
    description: 'Interactive statistics explorations (Streamlit).',
    href: 'https://statisticsdashboard-vivekdhandapani.streamlit.app/',
    icon: 'bars',
  },
];
