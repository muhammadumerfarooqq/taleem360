// The ONLY place that talks to a backend. Screens import from here, never fetch directly.
// Follows docs/API.md. In mock mode (VITE_USE_MOCK) every function returns sample data.
import { heartModel, homeData, mockMe, teacherClasses, teacherResultsByClass } from './mock/data'
import { matchesDemoDiagram } from './mock/matcher'
import { isValidSubmission, mockAsk, mockSubmit } from './mock/server'
import { mockContents, mockFigures, mockModels, mockQuizzes, generatorModel, pick, subjectModelIds } from './mock/subjects'
import type {
  ApiErrorCode,
  AskAnswer,
  AskRequest,
  HomeData,
  ListModelsParams,
  Me,
  ModelContent,
  ModelInfo,
  ModelList,
  Quiz,
  QuizAnswer,
  QuizSubmitResult,
  RecognizeResult,
  TeacherClasses,
  TeacherResults,
  TeacherResultsParams,
} from './types'

export type * from './types'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL ?? '').replace(/\/+$/, '')
const API_BASE = `${BACKEND_URL}/api/v1`

const MAX_PHOTO_SIDE = 1024
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

// ---------- errors ----------

const KNOWN_CODES: ApiErrorCode[] = [
  'invalid_request',
  'invalid_image',
  'unauthorized',
  'forbidden',
  'not_found',
  'too_large',
  'rate_limited',
  'server_error',
]

export class ApiError extends Error {
  code: ApiErrorCode
  status: number

  constructor(code: ApiErrorCode, message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json()
    const code = body?.error?.code as ApiErrorCode
    const message = String(body?.error?.message ?? res.statusText)
    return new ApiError(KNOWN_CODES.includes(code) ? code : 'server_error', message, res.status)
  } catch {
    return new ApiError('server_error', res.statusText || 'Request failed', res.status)
  }
}

// ---------- auth ----------

// Stub. Returns null in mock mode. Firebase Auth fills this in (step 5) with the ID token.
export async function getAuthToken(): Promise<string | null> {
  return null
}

// ---------- plumbing ----------

const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms))

async function mock<T>(value: T): Promise<T> {
  await delay()
  return value
}

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = await getAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('server_error', 'Could not reach the server')
  }
  if (!res.ok) throw await toApiError(res)
  return (await res.json()) as T
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return http<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ''
}

// Real mode only: shrink the photo to 1024px (longest side) JPEG before upload.
async function resizePhoto(photo: Blob): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(photo)
  } catch {
    throw new ApiError('invalid_image', 'The photo could not be read')
  }
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85))
  if (!jpeg) throw new ApiError('invalid_image', 'The photo could not be converted')
  if (jpeg.size > MAX_PHOTO_BYTES) throw new ApiError('too_large', 'The photo is larger than 5 MB')
  return jpeg
}

// ---------- auth-free helpers ----------

export interface LoginResult {
  token: string
  role: 'student' | 'teacher'
}

// Mock only. The real login is the Firebase Auth SDK (step 5); there is no backend login endpoint.
export function login(email: string, password: string): Promise<LoginResult> {
  void email
  void password
  return mock({ token: 'mock-token', role: 'student' })
}

// ---------- endpoints (docs/API.md) ----------

export function getMe(): Promise<Me> {
  if (USE_MOCK) return mock(mockMe)
  return http('/me')
}

export function getHomeData(): Promise<HomeData> {
  if (USE_MOCK) return mock(homeData)
  return http('/home')
}

export function listModels(params: ListModelsParams = {}): Promise<ModelList> {
  if (USE_MOCK) {
    const all = Object.values(mockModels).map(({ id, title, subject, classLevel, chapter }) => ({
      id,
      title,
      subject,
      classLevel,
      chapter,
      thumbUrl: '',
    }))
    const models = all.filter(
      (m) =>
        (!params.subject || m.subject.toLowerCase() === params.subject.toLowerCase()) &&
        (!params.classLevel || m.classLevel === params.classLevel),
    )
    return mock({ models, page: params.page ?? 1, pageSize: params.pageSize ?? 20, total: models.length })
  }
  return http(`/models${query({ ...params })}`)
}

// mockFail and subject only affect the mock. mockFail makes recognition return not_found. subject is the
// Home tab the student came from (biology, chemistry, physics, cs): the mock "recognises" that tab's diagram.
// The real request never sends them (docs/API.md: the server recognises the diagram from the photo alone).
export async function recognize(
  photo: Blob | File,
  opts: { mockFail?: boolean; subject?: string } = {},
): Promise<RecognizeResult> {
  if (USE_MOCK) {
    if (opts.mockFail) {
      return mock({
        status: 'not_found',
        reason: 'low_confidence',
        tip: 'Hold the phone steady and fill the box',
      })
    }
    // Demo: a real photo (not empty) must show the generator diagram, otherwise "not found".
    // Without a photo (the "continue without a photo" demo link) the Home subject decides.
    let modelId = pick(subjectModelIds, opts.subject) ?? heartModel.id
    let confidence = 0.94
    if (photo.size > 0) {
      const match = await matchesDemoDiagram(photo)
      if (!match.matched) {
        return mock({
          status: 'not_found',
          reason: 'low_confidence',
          tip: 'Fit the whole diagram inside the box and hold the phone steady',
        })
      }
      modelId = generatorModel.id
      confidence = Math.min(0.99, match.score)
    }
    const figure = pick(mockFigures, modelId) ?? { label: heartModel.title, figure: '' }
    return mock({
      status: 'ok',
      modelId,
      label: figure.label,
      confidence,
      matchedBy: 'embedding+geometry',
      figure: figure.figure,
    })
  }
  const form = new FormData()
  form.append('photo', await resizePhoto(photo), 'photo.jpg')
  return http('/recognize', { method: 'POST', body: form })
}

export function getModel(id: string): Promise<ModelInfo> {
  if (USE_MOCK) {
    const model = pick(mockModels, id)
    if (!model) return Promise.reject(new ApiError('not_found', `Model '${id}' does not exist.`, 404))
    return mock(model)
  }
  return http(`/models/${encodeURIComponent(id)}`)
}

export function getContent(id: string): Promise<ModelContent> {
  if (USE_MOCK) {
    const content = pick(mockContents, id)
    if (!content) return Promise.reject(new ApiError('not_found', `Model '${id}' does not exist.`, 404))
    return mock(content)
  }
  return http(`/models/${encodeURIComponent(id)}/content`)
}

export function askQuestion(req: AskRequest): Promise<AskAnswer> {
  if (USE_MOCK) {
    if (!req.question.trim()) return Promise.reject(new ApiError('invalid_request', 'The question is empty.', 400))
    return delay(900).then(() => mockAsk(req)) // a little longer so the typing indicator shows
  }
  return postJson('/ask', req)
}

export function getQuiz(id: string): Promise<Quiz> {
  if (USE_MOCK) {
    const quiz = pick(mockQuizzes, id)
    if (!quiz) return Promise.reject(new ApiError('not_found', `Model '${id}' does not exist.`, 404))
    return mock(quiz) // never contains correct answers
  }
  return http(`/models/${encodeURIComponent(id)}/quiz`)
}

export function submitQuiz(quizId: string, answers: QuizAnswer[]): Promise<QuizSubmitResult> {
  if (USE_MOCK) {
    // The mock simulates the server: it marks the answers using a private key.
    if (!isValidSubmission(quizId, answers)) {
      return Promise.reject(new ApiError('invalid_request', 'Malformed quiz answers.', 400))
    }
    const result = mockSubmit(quizId, answers)
    if (!result) return Promise.reject(new ApiError('not_found', `Quiz '${quizId}' does not exist.`, 404))
    return mock(result)
  }
  return postJson(`/quizzes/${encodeURIComponent(quizId)}/submit`, { answers })
}

export function getTeacherClasses(): Promise<TeacherClasses> {
  if (USE_MOCK) return mock({ classes: teacherClasses })
  return http('/teacher/classes')
}

export function getTeacherResults(params: TeacherResultsParams = {}): Promise<TeacherResults> {
  if (USE_MOCK) {
    const key = params.classId ?? teacherClasses[0].id
    const data = teacherResultsByClass[key]
    if (!data) return Promise.reject(new ApiError('not_found', `Class '${key}' does not exist.`, 404))
    const rows = params.modelId ? data.rows.filter((r) => r.modelId === params.modelId) : data.rows
    return mock({ ...data, rows })
  }
  return http(`/teacher/results${query({ ...params })}`)
}
