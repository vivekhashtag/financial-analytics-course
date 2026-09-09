/** Types mirroring schema/CONTENT_SCHEMA.md. The content is the spec. */

export type PartId = 'A' | 'B' | 'C' | 'D' | 'capstone' | 'appendix';

export interface ModulePage {
  slug: string;
  title: string;
  file: string;
}

export interface ModuleNotebook {
  id: string;
  title: string;
  file: string;
  colabEnabled?: boolean;
  datasets?: string[];
  packages?: string[];
  solutionFile?: string | null;
}

export interface StreamlitApp {
  id: string;
  title: string;
  file: string;
  runInstructions: string;
  datasets?: string[];
}

export interface AiGreen {
  situation: string;
  prompt: string;
}
export interface AiRed {
  danger: string;
  why: string;
  rule: string;
}

export interface Badge {
  id: string;
  label: string;
  icon?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  hook?: string;
  lesson?: string;
  file?: string;
}

export interface CourseModule {
  id: string;
  number: string;
  part: PartId;
  title: string;
  subtitle?: string | null;
  estimatedMinutes: number;
  status: 'draft' | 'review' | 'published';
  prerequisites: string[];
  learningOutcomes: string[];
  pages: ModulePage[];
  notebooks: ModuleNotebook[];
  streamlitApps: StreamlitApp[];
  /** passingScore is a percentage, 1-100 (see module.schema.json) */
  quiz: { file: string; passingScore?: number } | null;
  exercises: { file: string } | null;
  biasCheck: { enabled: boolean; prompt: string | null } | null;
  aiSidebar: { green?: AiGreen[]; red?: AiRed[] } | null;
  streamConnector: Record<string, string> | null;
  badge: Badge | null;
  caseStudy: CaseStudy | null;
  widgets: string[];
}

/* ---------- quiz ---------- */

export type QuestionType = 'single' | 'multi' | 'truefalse' | 'match' | 'numeric';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  /** index for single/truefalse, index[] for multi, number for numeric */
  answer?: number | number[];
  /** numeric questions */
  tolerance?: number;
  unit?: string;
  /** match questions */
  pairs?: { left: string; right: string }[];
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  questions: QuizQuestion[];
  /** absolute number of correct answers needed to pass, derived from passingPercent */
  passMark: number;
  /** the module's pass mark as stored: a percentage, 1-100 */
  passingPercent: number;
}

/* ---------- exercises ---------- */

export interface ExerciseField {
  id: string;
  label: string;
  type: 'multiselect' | 'text' | 'single';
  options?: string[];
  modelAnswer?: string | string[];
}

export interface Exercise {
  id: string;
  /** absent in Modules 4+ where the exercise lives entirely in the notebook */
  type?: 'code' | 'form' | 'sort' | 'scenario';
  title: string;
  brief?: string;
  points?: number;
  starterCode?: string;
  checkCode?: string;
  hints?: string[];
  solution?: string;
  notebook?: string;
  notebookRef?: string;
  requiresAttempt?: boolean;
  items?: { label: string; bucket: string }[];
  scenarios?: { text: string; answer: string; why?: string }[];
  fields?: ExerciseField[];
  dataset?: string;
  modelReport?: string;
}

export interface Exercises {
  exercises: Exercise[];
}

/* ---------- datasets ---------- */

export interface DatasetQuirk {
  code: string;
  quirk: string;
  teaches: string;
}

export interface Dataset {
  id: string;
  file: string;
  rawUrl: string;
  title: string;
  rows: number;
  cols: number;
  synthetic: boolean;
  grain: string;
  units: string;
  columns?: string[];
  structure?: string;
  usedIn: string[];
  joinsTo?: { dataset: string; on: string }[];
  quirks: DatasetQuirk[];
}
