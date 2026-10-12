// Types for docs/API.md (the binding contract). Used by api.ts and by the mock data.

export type ApiErrorCode =
  | 'invalid_request'
  | 'invalid_image'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'too_large'
  | 'rate_limited'
  | 'server_error'

export type Lang = 'en' | 'ur'

export interface Me {
  uid: string
  name: string
  role: 'student' | 'teacher'
  classLevel: number | null
  classId: string | null
}

export interface HomeData {
  student: { name: string; classLevel: number }
  subjects: { id: string; name: string; examples: string }[]
  recent: { modelId: string; title: string; subject: string; chapter: string }[]
}

export interface ModelSummary {
  id: string
  title: string
  subject: string
  classLevel: number
  chapter: string
  thumbUrl: string
}

export interface ModelList {
  models: ModelSummary[]
  page: number
  pageSize: number
  total: number
}

export interface ListModelsParams {
  subject?: string
  classLevel?: number
  page?: number
  pageSize?: number
}

export type RecognizeResult =
  | {
      status: 'ok'
      modelId: string
      label: string
      confidence: number
      matchedBy: 'embedding' | 'embedding+geometry' | 'caption'
      figure: string
    }
  | { status: 'not_found'; reason: string; tip: string }

export interface Hotspot {
  partId: string
  position: string
  normal: string
}

export interface ModelInfo {
  id: string
  title: string
  titleUr: string
  subject: string
  classLevel: number
  chapter: string
  glbUrl: string
  glbExpiresAt: string
  glbSizeBytes: number
  version: number
  hotspots: Hotspot[]
}

export interface ContentPart {
  id: string
  nameEn: string
  nameUr: string
  textEn: string
  textUr: string
  audioEnUrl: string | null
  audioUrUrl: string | null
  color: string
}

export interface ModelContent {
  modelId: string
  source: { book: string; chapter: string; pages: string }
  // Not in docs/API.md yet (documented there as an optional addition): which part is selected first.
  defaultPartId?: string
  parts: ContentPart[]
}

export interface AskRequest {
  modelId: string
  partId?: string
  question: string
  lang: Lang
}

export interface AskSource {
  book: string
  chapter: string
  page: number
}

export interface AskAnswer {
  answer: string
  lang: Lang
  grounded: boolean
  sources: AskSource[]
}

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  text: string
  options: QuizOption[]
}

// Never contains correct answers.
export interface Quiz {
  quizId: string
  modelId: string
  questions: QuizQuestion[]
}

export interface QuizAnswer {
  questionId: string
  optionId: string
}

export interface QuizQuestionResult {
  questionId: string
  correct: boolean
  correctOptionId: string
  topic: string
}

export interface QuizSubmitResult {
  score: number
  total: number
  results: QuizQuestionResult[]
  savedResultId: string
}

export interface TeacherClass {
  id: string
  name: string
  subject: string
  studentCount: number
}

export interface TeacherClasses {
  classes: TeacherClass[]
}

export interface TeacherResultsParams {
  classId?: string
  modelId?: string
}

export type ResultLabel = 'Strong' | 'Okay' | 'Needs help'

export interface TeacherResults {
  summary: { studentsTaken: number; classAverage: number; mostScannedModel: string }
  rows: {
    studentName: string
    modelId: string
    score: number
    total: number
    label: ResultLabel
  }[]
  weakTopics: { topic: string; percentCorrect: number }[]
}
