// The fake server used in mock mode. It is the only code that reads the private answer key.
// It behaves like the real backend described in docs/API.md.
import type { AskAnswer, AskRequest, Lang, QuizAnswer, QuizSubmitResult } from '../types'
import { answerKeys } from './answerKey'
import { heartBook, heartQuiz } from './data'

interface Topic {
  keywords: string[]
  en: string
  ur: string
}

// Sample grounded answers for the heart chapter. Real answers come from the RAG tutor (step 6).
const topics: Topic[] = [
  {
    keywords: ['aorta', 'thick', 'wall', 'ابہر', 'دیوار'],
    en: 'Blood leaves the left ventricle at high pressure, so the aorta needs a strong, elastic wall. It stretches as the heart pushes blood out and springs back, which helps keep blood moving.',
    ur: 'دل کے بائیں بطن سے خون بہت زیادہ دباؤ کے ساتھ نکلتا ہے، اس لیے ابہر کی دیوار مضبوط اور لچکدار ہوتی ہے۔ جب دل خون کو باہر دھکیلتا ہے تو یہ پھیلتی ہے اور پھر واپس سکڑ جاتی ہے، جس سے خون آگے بڑھتا رہتا ہے۔',
  },
  {
    keywords: ['valve', 'valves', 'والو', 'والوز'],
    en: 'The valves are flaps inside the heart. They open to let blood through and close to stop it flowing backwards, so blood moves in one direction only.',
    ur: 'والوز دل کے اندر پردے ہیں۔ یہ کھل کر خون کو گزرنے دیتے ہیں اور بند ہو کر اسے پیچھے لوٹنے سے روکتے ہیں، اس طرح خون صرف ایک ہی سمت میں بہتا ہے۔',
  },
  {
    keywords: ['artery', 'arteries', 'vein', 'veins', 'شریان', 'شریانیں', 'ورید', 'وریدیں'],
    en: 'Arteries carry blood away from the heart and have thick, elastic walls. Veins carry blood back to the heart; they have thinner walls and valves to stop backflow.',
    ur: 'شریانیں خون کو دل سے دور لے جاتی ہیں اور ان کی دیواریں موٹی اور لچکدار ہوتی ہیں۔ وریدیں خون کو واپس دل تک لاتی ہیں؛ ان کی دیواریں پتلی ہوتی ہیں اور ان میں والوز ہوتے ہیں جو خون کو پیچھے جانے سے روکتے ہیں۔',
  },
]

const notFound: Record<Lang, string> = {
  en: 'I could not find this in your textbook. Please ask your teacher.',
  ur: 'یہ بات آپ کی کتاب میں نہیں ملی۔ براہِ کرم اپنے استاد سے پوچھیں۔',
}

export function mockAsk(req: AskRequest): AskAnswer {
  const q = req.question.toLowerCase()
  const hit = topics.find((t) => t.keywords.some((k) => q.includes(k)))
  if (!hit) return { answer: notFound[req.lang], lang: req.lang, grounded: false, sources: [] }
  return { answer: hit[req.lang], lang: req.lang, grounded: true, sources: [heartBook] }
}

export function mockSubmit(quizId: string, answers: QuizAnswer[]): QuizSubmitResult | null {
  const key = answerKeys[quizId]
  if (!key) return null
  const ids = Object.keys(key)
  const results = ids.map((questionId) => {
    const given = answers.find((a) => a.questionId === questionId)
    return {
      questionId,
      correct: given?.optionId === key[questionId].correctOptionId, // a missing answer counts as wrong
      correctOptionId: key[questionId].correctOptionId,
      topic: key[questionId].topic,
    }
  })
  return {
    score: results.filter((r) => r.correct).length,
    total: results.length,
    results,
    savedResultId: `res_mock_${Date.now()}`,
  }
}

export function isValidSubmission(quizId: string, answers: QuizAnswer[]): boolean {
  const key = answerKeys[quizId]
  if (!key || !Array.isArray(answers)) return false
  return answers.every((a) => {
    const question = heartQuiz.questions.find((q) => q.id === a?.questionId)
    return !!question && question.options.some((o) => o.id === a.optionId)
  })
}
