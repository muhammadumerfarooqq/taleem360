// The ONLY place that talks to a backend. Screens import from here, never fetch directly.
import {
  heartModel,
  heartQuiz,
  homeData,
  sampleStudent,
  teacherResults,
  type HomeData,
  type ModelInfo,
  type QuizQuestion,
  type QuizResult,
  type Student,
  type TeacherResults,
} from './mock/data'

export type {
  HomeData,
  ModelInfo,
  ModelPart,
  QuizQuestion,
  QuizResult,
  Student,
  TeacherResults,
} from './mock/data'

export interface LoginResult {
  token: string
  role: 'student' | 'teacher'
  student?: Student
}

export interface RecognizeResult {
  modelId: string
  confidence: number
}

export interface ModelContent {
  id: string
  title: string
  summary: string
  summaryUr: string
}

export interface AskAnswer {
  answer: string
  sources: string[]
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? ''

const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms))

async function mock<T>(value: T): Promise<T> {
  await delay()
  return value
}

// Real backend call. Wired up in a later step; screens do not change.
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, init)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return (await res.json()) as T
}

const post = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export function login(email: string, password: string): Promise<LoginResult> {
  if (USE_MOCK) {
    void password
    return mock({ token: 'mock-token', role: 'student', student: { ...sampleStudent, email } })
  }
  return http('/auth/login', post({ email, password }))
}

export function getHomeData(): Promise<HomeData> {
  if (USE_MOCK) return mock(homeData)
  return http('/home')
}

export function recognize(photo: Blob | File): Promise<RecognizeResult> {
  if (USE_MOCK) {
    void photo
    return mock({ modelId: heartModel.id, confidence: 0.94 })
  }
  const form = new FormData()
  form.append('photo', photo)
  return http('/recognize', { method: 'POST', body: form })
}

export function getModel(id: string): Promise<ModelInfo> {
  if (USE_MOCK) return mock({ ...heartModel, id })
  return http(`/models/${encodeURIComponent(id)}`)
}

export function getContent(id: string): Promise<ModelContent> {
  if (USE_MOCK) {
    return mock({
      id,
      title: heartModel.title,
      summary: 'The heart is a muscular pump that sends blood around the body.',
      summaryUr: 'دل ایک پٹھوں والا پمپ ہے جو خون کو پورے جسم میں پہنچاتا ہے۔',
    })
  }
  return http(`/content/${encodeURIComponent(id)}`)
}

export function askQuestion(id: string, text: string): Promise<AskAnswer> {
  if (USE_MOCK) {
    void text
    return mock({
      answer:
        'The aorta wall is thick because blood leaves the left ventricle at high pressure. (Sample answer)',
      sources: ['Class 9 Biology · Ch 9 Transport'],
    })
  }
  return http('/ask', post({ id, text }))
}

export function getQuiz(id: string): Promise<QuizQuestion[]> {
  if (USE_MOCK) {
    void id
    return mock(heartQuiz)
  }
  return http(`/quiz/${encodeURIComponent(id)}`)
}

export function submitQuiz(id: string, answers: number[]): Promise<QuizResult> {
  if (USE_MOCK) {
    void id
    const score = answers.filter((a, i) => heartQuiz[i]?.correctIndex === a).length
    return mock({
      score,
      total: heartQuiz.length,
      strong: ['Chambers of the heart', 'Aorta and its role'],
      review: ['Heart valves', 'Arteries and veins'],
    })
  }
  return http(`/quiz/${encodeURIComponent(id)}/submit`, post({ answers }))
}

export function getTeacherResults(): Promise<TeacherResults> {
  if (USE_MOCK) return mock(teacherResults)
  return http('/teacher/results')
}
