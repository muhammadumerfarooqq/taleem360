// The fake server used in mock mode. It is the only code that reads the private answer key.
// It behaves like the real backend described in docs/API.md.
import type { AskAnswer, AskRequest, Lang, QuizAnswer, QuizSubmitResult } from '../types'
import { answerKeys } from './answerKey'
import { mockBooks, mockQuizzes, pick } from './subjects'

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

// Sample grounded answers for the other subject tabs (same idea as the heart chapter above).
const atomTopics: Topic[] = [
  {
    keywords: ['valence', 'outer', 'outermost', 'bond', 'ویلنس', 'بیرونی'],
    en: 'Valence electrons are the electrons in the outermost shell. Carbon has 4 of them. Atoms share, give or take these electrons to form bonds, so they decide how carbon joins with other atoms.',
    ur: 'ویلنس الیکٹرون سب سے بیرونی خول کے الیکٹرون ہوتے ہیں۔ کاربن میں ان کی تعداد 4 ہے۔ ایٹم انہی الیکٹرونوں کو بانٹ کر، دے کر یا لے کر بندھن بناتے ہیں، اس لیے یہی طے کرتے ہیں کہ کاربن دوسرے ایٹموں سے کیسے جڑے گا۔',
  },
  {
    keywords: ['shell', 'orbit', 'خول'],
    en: 'Electrons move around the nucleus in shells. The first (K) shell holds up to 2 electrons and the second (L) shell up to 8. Carbon has 6 electrons, so 2 are in the K shell and 4 are in the L shell.',
    ur: 'الیکٹرون مرکزے کے گرد خولوں میں گھومتے ہیں۔ پہلے خول (K) میں زیادہ سے زیادہ 2 اور دوسرے خول (L) میں زیادہ سے زیادہ 8 الیکٹرون آ سکتے ہیں۔ کاربن میں 6 الیکٹرون ہیں، اس لیے 2 پہلے خول میں اور 4 دوسرے خول میں ہوتے ہیں۔',
  },
  {
    keywords: ['nucleus', 'proton', 'neutron', 'مرکزہ', 'مرکزے', 'پروٹون', 'نیوٹرون'],
    en: 'The nucleus is at the centre of the atom and holds the protons and neutrons. A carbon nucleus has 6 protons. Protons have a positive charge and neutrons have no charge.',
    ur: 'مرکزہ ایٹم کے بیچ میں ہوتا ہے اور اس میں پروٹون اور نیوٹرون ہوتے ہیں۔ کاربن کے مرکزے میں 6 پروٹون ہوتے ہیں۔ پروٹون پر مثبت چارج ہوتا ہے اور نیوٹرون پر کوئی چارج نہیں ہوتا۔',
  },
]

const motorTopics: Topic[] = [
  {
    keywords: ['commutator', 'split ring', 'reverse', 'کموٹیٹر'],
    en: 'The commutator is a split ring. Every half turn it swaps which half of the ring touches each brush, so the current in the coil reverses. Without it the coil would swing back and forth instead of turning round and round.',
    ur: 'کموٹیٹر ایک کٹی ہوئی انگوٹھی ہے۔ ہر آدھے چکر کے بعد اس کے دونوں حصے برشوں سے بدل جاتے ہیں، اس لیے کوائل میں رو کی سمت الٹ جاتی ہے۔ اس کے بغیر کوائل مسلسل گھومنے کے بجائے آگے پیچھے جھولتی رہتی۔',
  },
  {
    keywords: ['brush', 'برش'],
    en: 'The brushes are fixed carbon contacts that press against the spinning commutator. They carry current from the battery into the coil.',
    ur: 'برش کاربن کے ساکن رابطے ہیں جو گھومتے ہوئے کموٹیٹر سے لگے رہتے ہیں۔ یہ بیٹری سے برقی رو کو کوائل تک پہنچاتے ہیں۔',
  },
  {
    keywords: ['faster', 'speed', 'تیز', 'رفتار'],
    en: 'A motor spins faster with a stronger magnet, more turns of wire in the coil, or a larger current.',
    ur: 'موٹر زیادہ طاقتور مقناطیس، کوائل میں تار کے زیادہ چکروں یا زیادہ برقی رو سے تیز گھومتی ہے۔',
  },
  {
    keywords: ['force', 'magnetic', 'field', 'spin', 'turn', 'قوت', 'مقناطیس', 'گھوم'],
    en: 'A wire carrying current in a magnetic field feels a force. In the coil the current goes one way on one side and the opposite way on the other side, so the two sides are pushed in opposite directions and the coil turns.',
    ur: 'مقناطیسی میدان میں برقی رو والی تار پر قوت لگتی ہے۔ کوائل کے ایک طرف رو ایک سمت میں اور دوسری طرف الٹی سمت میں بہتی ہے، اس لیے دونوں اطراف الٹی سمتوں میں دھکیلے جاتے ہیں اور کوائل گھومتی ہے۔',
  },
]

const computerTopics: Topic[] = [
  {
    // Written with a leading space so that "program" does not match "ram" (see mockAsk).
    keywords: [' ram', 'random access', 'short-term', 'ریم', 'میموری'],
    en: 'RAM is the short-term memory of the computer. It holds the programs and data being used right now and it is fast. When the power goes off, RAM is emptied, but storage keeps its data.',
    ur: 'ریم کمپیوٹر کی قلیل مدتی یادداشت ہے۔ اس میں وہ پروگرام اور ڈیٹا ہوتا ہے جو اس وقت استعمال ہو رہا ہو اور یہ تیز ہوتی ہے۔ بجلی بند ہونے پر ریم خالی ہو جاتی ہے، جبکہ اسٹوریج اپنا ڈیٹا رکھتا ہے۔',
  },
  {
    keywords: ['storage', 'hard disk', 'ssd', 'اسٹوریج', 'ڈسک'],
    en: 'Storage, such as a hard disk or an SSD, keeps your files and programs even when the computer is switched off. It is slower than RAM but it does not lose its data.',
    ur: 'اسٹوریج، جیسے ہارڈ ڈسک یا ایس ایس ڈی، آپ کی فائلیں اور پروگرام کمپیوٹر بند ہونے پر بھی محفوظ رکھتا ہے۔ یہ ریم سے سست ہوتا ہے لیکن اپنا ڈیٹا نہیں کھوتا۔',
  },
  {
    keywords: ['cpu', 'processor', 'brain', 'سی پی یو', 'پروسیسر', 'دماغ'],
    en: 'The CPU is the processor. It carries out the instructions of programs and does the calculations, so it is called the brain of the computer.',
    ur: 'سی پی یو پروسیسر ہے۔ یہ پروگراموں کی ہدایات پر عمل کرتا ہے اور حساب کتاب کرتا ہے، اسی لیے اسے کمپیوٹر کا دماغ کہا جاتا ہے۔',
  },
  {
    keywords: ['motherboard', 'circuit board', 'مدر بورڈ', 'سرکٹ'],
    en: 'The motherboard is the main circuit board. The CPU, RAM and storage all connect to it, and its wires let them talk to each other.',
    ur: 'مدر بورڈ مرکزی سرکٹ بورڈ ہے۔ سی پی یو، ریم اور اسٹوریج سب اسی سے جڑتے ہیں اور اس کی تاریں انہیں آپس میں رابطہ کرنے دیتی ہیں۔',
  },
]

// Which topics answer questions about which model. Heart is the original chapter.
const topicsByModel: Record<string, Topic[]> = {
  heart: topics,
  'carbon-atom': atomTopics,
  'dc-motor': motorTopics,
  'computer-hardware': computerTopics,
}

const notFound: Record<Lang, string> = {
  en: 'I could not find this in your textbook. Please ask your teacher.',
  ur: 'یہ بات آپ کی کتاب میں نہیں ملی۔ براہِ کرم اپنے استاد سے پوچھیں۔',
}

export function mockAsk(req: AskRequest): AskAnswer {
  // A leading space lets a keyword such as " ram" match a whole word without matching "program".
  const q = ` ${req.question.toLowerCase()}`
  const hit = (pick(topicsByModel, req.modelId) ?? topics).find((t) => t.keywords.some((k) => q.includes(k)))
  if (!hit) return { answer: notFound[req.lang], lang: req.lang, grounded: false, sources: [] }
  return { answer: hit[req.lang], lang: req.lang, grounded: true, sources: [pick(mockBooks, req.modelId) ?? mockBooks.heart] }
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
  const quiz = Object.values(mockQuizzes).find((q) => q.quizId === quizId)
  if (!key || !quiz || !Array.isArray(answers)) return false
  return answers.every((a) => {
    const question = quiz.questions.find((q) => q.id === a?.questionId)
    return !!question && question.options.some((o) => o.id === a.optionId)
  })
}
