// Sample data for the Chemistry, Physics and Computer Science tabs (mock mode only).
// Same shapes as the heart data in data.ts and the responses in docs/API.md.
// The chapter names, figure numbers and page numbers are sample placeholders. Replace them with the
// real STBB book references when the content is checked. The quiz answer key is NOT here (see answerKey.ts).
import type { AskSource, ModelContent, ModelInfo, Quiz } from '../types'
import { heartBook, heartContent, heartModel, heartQuiz } from './data'

// ---------- Chemistry: carbon atom ----------

export const atomModel: ModelInfo = {
  id: 'carbon-atom',
  title: 'Carbon atom',
  titleUr: 'کاربن ایٹم',
  subject: 'Chemistry',
  classLevel: 9,
  chapter: 'Ch 4 Atomic structure',
  glbUrl: '',
  glbExpiresAt: '2099-01-01T00:00:00Z',
  glbSizeBytes: 0,
  version: 1,
  hotspots: [
    { partId: 'nucleus', position: '0m 0m 0m', normal: '0m 1m 0m' },
    { partId: 'k-shell', position: '0m 0.19m 0m', normal: '0m 1m 0m' },
    { partId: 'l-shell', position: '0m 0.37m 0m', normal: '0m 1m 0m' },
    { partId: 'valence-electrons', position: '0.26m 0.26m 0m', normal: '0m 1m 0m' },
  ],
}

export const atomBook: AskSource = { book: 'Class 9 Chemistry', chapter: 'Ch 4 Atomic structure', page: 52 }

export const atomContent: ModelContent = {
  modelId: 'carbon-atom',
  source: { book: 'Class 9 Chemistry', chapter: 'Ch 4 Atomic structure', pages: '50-53' },
  defaultPartId: 'valence-electrons',
  parts: [
    {
      id: 'nucleus',
      nameEn: 'Nucleus',
      nameUr: 'مرکزہ',
      textEn:
        "The tiny, dense centre of the atom. It holds the protons and neutrons, so it has almost all of the atom's mass.",
      textUr:
        'ایٹم کا چھوٹا اور گھنا مرکز۔ اس میں پروٹون اور نیوٹرون ہوتے ہیں، اس لیے ایٹم کی تقریباً ساری کمیت یہیں ہوتی ہے۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#FFB020',
    },
    {
      id: 'k-shell',
      nameEn: 'K shell',
      nameUr: 'پہلا خول',
      textEn:
        'The first shell, closest to the nucleus. It can hold at most 2 electrons, and carbon has 2 electrons here.',
      textUr:
        'پہلا خول جو مرکزے کے سب سے قریب ہوتا ہے۔ اس میں زیادہ سے زیادہ 2 الیکٹرون آ سکتے ہیں، اور کاربن میں یہاں 2 الیکٹرون ہوتے ہیں۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#5B86F0',
    },
    {
      id: 'l-shell',
      nameEn: 'L shell',
      nameUr: 'دوسرا خول',
      textEn: 'The second shell. It can hold up to 8 electrons. Carbon has 4 electrons here.',
      textUr:
        'دوسرا خول۔ اس میں زیادہ سے زیادہ 8 الیکٹرون آ سکتے ہیں۔ کاربن میں یہاں 4 الیکٹرون ہوتے ہیں۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#14B8A6',
    },
    {
      id: 'valence-electrons',
      nameEn: 'Valence electrons',
      nameUr: 'ویلنس الیکٹرون',
      textEn:
        'The electrons in the outermost shell. Carbon has 4. They decide how the atom joins with other atoms.',
      textUr:
        'سب سے بیرونی خول کے الیکٹرون۔ کاربن میں 4 ہوتے ہیں۔ یہی طے کرتے ہیں کہ ایٹم دوسرے ایٹموں سے کیسے جڑے گا۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#E0566F',
    },
  ],
}

export const atomQuiz: Quiz = {
  quizId: 'quiz_atom_v1',
  modelId: 'carbon-atom',
  questions: [
    {
      id: 'q1',
      text: 'How many protons does a carbon atom have?',
      options: [
        { id: 'a', text: 'Four' },
        { id: 'b', text: 'Six' },
        { id: 'c', text: 'Eight' },
        { id: 'd', text: 'Twelve' },
      ],
    },
    {
      id: 'q2',
      text: 'Where is almost all of the mass of an atom found?',
      options: [
        { id: 'a', text: 'In the outer shell' },
        { id: 'b', text: 'In the K shell' },
        { id: 'c', text: 'In the nucleus' },
        { id: 'd', text: 'Between the shells' },
      ],
    },
    {
      id: 'q3',
      text: 'How many electrons can the first (K) shell hold at most?',
      options: [
        { id: 'a', text: 'Eight' },
        { id: 'b', text: 'Two' },
        { id: 'c', text: 'Six' },
        { id: 'd', text: 'Four' },
      ],
    },
    {
      id: 'q4',
      text: 'How many electrons are in the outer shell of a carbon atom?',
      options: [
        { id: 'a', text: 'Two' },
        { id: 'b', text: 'Six' },
        { id: 'c', text: 'Eight' },
        { id: 'd', text: 'Four' },
      ],
    },
    {
      id: 'q5',
      text: 'Which particles are found in the nucleus?',
      options: [
        { id: 'a', text: 'Protons and electrons' },
        { id: 'b', text: 'Neutrons and electrons' },
        { id: 'c', text: 'Protons and neutrons' },
        { id: 'd', text: 'Only electrons' },
      ],
    },
  ],
}

// ---------- Physics: electric motor ----------

export const motorModel: ModelInfo = {
  id: 'dc-motor',
  title: 'Electric motor',
  titleUr: 'برقی موٹر',
  subject: 'Physics',
  classLevel: 9,
  chapter: 'Ch 14 Electromagnetism',
  glbUrl: '',
  glbExpiresAt: '2099-01-01T00:00:00Z',
  glbSizeBytes: 0,
  version: 1,
  hotspots: [
    { partId: 'magnet', position: '-0.30m 0.05m 0m', normal: '0m 1m 0m' },
    { partId: 'coil', position: '0m 0.18m 0m', normal: '0m 1m 0m' },
    { partId: 'commutator', position: '0m -0.25m 0m', normal: '0m 1m 0m' },
    { partId: 'brushes', position: '-0.38m -0.25m 0m', normal: '0m 1m 0m' },
  ],
}

export const motorBook: AskSource = { book: 'Class 9 Physics', chapter: 'Ch 14 Electromagnetism', page: 171 }

export const motorContent: ModelContent = {
  modelId: 'dc-motor',
  source: { book: 'Class 9 Physics', chapter: 'Ch 14 Electromagnetism', pages: '169-172' },
  defaultPartId: 'coil',
  parts: [
    {
      id: 'magnet',
      nameEn: 'Magnet',
      nameUr: 'مقناطیس',
      textEn:
        'The north and south poles make a magnetic field across the coil. This field pushes on the current in the coil.',
      textUr:
        'شمالی اور جنوبی قطب کوائل کے آر پار مقناطیسی میدان بناتے ہیں۔ یہ میدان کوائل میں بہنے والی برقی رو پر قوت لگاتا ہے۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#E0566F',
    },
    {
      id: 'coil',
      nameEn: 'Coil',
      nameUr: 'کوائل',
      textEn:
        'A loop of wire that carries current. In the magnetic field its two sides feel forces in opposite directions, which turns the coil.',
      textUr:
        'تار کا ایک لچھا جس میں برقی رو بہتی ہے۔ مقناطیسی میدان میں اس کے دونوں اطراف پر الٹی سمتوں میں قوتیں لگتی ہیں، جس سے کوائل گھومنے لگتی ہے۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#FFB020',
    },
    {
      id: 'commutator',
      nameEn: 'Commutator',
      nameUr: 'کموٹیٹر',
      textEn:
        'A split ring that reverses the current in the coil every half turn. This keeps the coil turning in the same direction.',
      textUr:
        'ایک کٹی ہوئی انگوٹھی جو ہر آدھے چکر کے بعد کوائل میں رو کی سمت الٹ دیتی ہے۔ اس سے کوائل ایک ہی سمت میں گھومتی رہتی ہے۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#14B8A6',
    },
    {
      id: 'brushes',
      nameEn: 'Brushes',
      nameUr: 'برش',
      textEn:
        'Carbon contacts that touch the spinning commutator. They pass current from the battery into the coil.',
      textUr:
        'کاربن کے رابطے جو گھومتے ہوئے کموٹیٹر کو چھوتے ہیں۔ یہ بیٹری سے برقی رو کو کوائل تک پہنچاتے ہیں۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#5B86F0',
    },
  ],
}

export const motorQuiz: Quiz = {
  quizId: 'quiz_motor_v1',
  modelId: 'dc-motor',
  questions: [
    {
      id: 'q1',
      text: 'What does an electric motor change electrical energy into?',
      options: [
        { id: 'a', text: 'Light energy' },
        { id: 'b', text: 'Sound energy' },
        { id: 'c', text: 'Kinetic energy (motion)' },
        { id: 'd', text: 'Chemical energy' },
      ],
    },
    {
      id: 'q2',
      text: 'What is the job of the commutator?',
      options: [
        { id: 'a', text: 'To make the magnetic field' },
        { id: 'b', text: 'To reverse the current every half turn' },
        { id: 'c', text: 'To store charge' },
        { id: 'd', text: 'To cool the coil' },
      ],
    },
    {
      id: 'q3',
      text: 'What happens to a wire carrying current in a magnetic field?',
      options: [
        { id: 'a', text: 'Nothing happens to it' },
        { id: 'b', text: 'It loses all of its current' },
        { id: 'c', text: 'It becomes a magnet pole' },
        { id: 'd', text: 'It feels a force' },
      ],
    },
    {
      id: 'q4',
      text: 'Which change makes a simple motor spin faster?',
      options: [
        { id: 'a', text: 'Using a stronger magnet' },
        { id: 'b', text: 'Using fewer turns of wire' },
        { id: 'c', text: 'Using a weaker battery' },
        { id: 'd', text: 'Removing the brushes' },
      ],
    },
    {
      id: 'q5',
      text: 'What do the brushes do?',
      options: [
        { id: 'a', text: 'Create the magnetic field' },
        { id: 'b', text: 'Make the coil heavier' },
        { id: 'c', text: 'Carry current to the spinning coil' },
        { id: 'd', text: 'Stop the motor' },
      ],
    },
  ],
}

// ---------- Computer Science: inside a computer ----------

export const computerModel: ModelInfo = {
  id: 'computer-hardware',
  title: 'Inside a computer',
  titleUr: 'کمپیوٹر کے اندر',
  subject: 'Computer Science',
  classLevel: 9,
  chapter: 'Ch 2 Computer systems',
  glbUrl: '',
  glbExpiresAt: '2099-01-01T00:00:00Z',
  glbSizeBytes: 0,
  version: 1,
  hotspots: [
    { partId: 'cpu', position: '-0.15m 0.30m 0m', normal: '0m 0m 1m' },
    { partId: 'ram', position: '0.15m 0.30m 0m', normal: '0m 0m 1m' },
    { partId: 'storage', position: '-0.12m -0.15m 0m', normal: '0m 0m 1m' },
    { partId: 'motherboard', position: '0.20m -0.20m 0m', normal: '0m 0m 1m' },
  ],
}

export const computerBook: AskSource = {
  book: 'Class 9 Computer Science',
  chapter: 'Ch 2 Computer systems',
  page: 24,
}

export const computerContent: ModelContent = {
  modelId: 'computer-hardware',
  source: { book: 'Class 9 Computer Science', chapter: 'Ch 2 Computer systems', pages: '22-25' },
  defaultPartId: 'cpu',
  parts: [
    {
      id: 'cpu',
      nameEn: 'CPU',
      nameUr: 'سی پی یو',
      textEn:
        'The central processing unit. It carries out the instructions of programs and does the calculations, so it is called the brain of the computer.',
      textUr:
        'سینٹرل پروسیسنگ یونٹ۔ یہ پروگراموں کی ہدایات پر عمل کرتا ہے اور حساب کتاب کرتا ہے، اسی لیے اسے کمپیوٹر کا دماغ کہا جاتا ہے۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#FFB020',
    },
    {
      id: 'ram',
      nameEn: 'RAM',
      nameUr: 'ریم',
      textEn:
        'Random access memory. It holds the programs and data in use right now. It is fast, but it is emptied when the power is switched off.',
      textUr:
        'رینڈم ایکسیس میموری۔ اس میں وہ پروگرام اور ڈیٹا ہوتا ہے جو اس وقت استعمال ہو رہا ہو۔ یہ تیز ہوتی ہے لیکن بجلی بند ہونے پر خالی ہو جاتی ہے۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#5B86F0',
    },
    {
      id: 'storage',
      nameEn: 'Storage',
      nameUr: 'اسٹوریج',
      textEn:
        'Keeps your files and programs even when the computer is off. A hard disk or an SSD is storage.',
      textUr:
        'آپ کی فائلیں اور پروگرام محفوظ رکھتا ہے، چاہے کمپیوٹر بند ہو۔ ہارڈ ڈسک اور ایس ایس ڈی اسٹوریج ہیں۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#14B8A6',
    },
    {
      id: 'motherboard',
      nameEn: 'Motherboard',
      nameUr: 'مدر بورڈ',
      textEn:
        'The main circuit board. The CPU, RAM and storage all connect to it, and its wires let them talk to each other.',
      textUr:
        'مرکزی سرکٹ بورڈ۔ سی پی یو، ریم اور اسٹوریج سب اسی سے جڑتے ہیں اور اس کی تاریں انہیں آپس میں رابطہ کرنے دیتی ہیں۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#E0566F',
    },
  ],
}

export const computerQuiz: Quiz = {
  quizId: 'quiz_computer_v1',
  modelId: 'computer-hardware',
  questions: [
    {
      id: 'q1',
      text: 'Which part is called the brain of the computer?',
      options: [
        { id: 'a', text: 'RAM' },
        { id: 'b', text: 'Storage' },
        { id: 'c', text: 'CPU' },
        { id: 'd', text: 'Motherboard' },
      ],
    },
    {
      id: 'q2',
      text: 'What happens to the data in RAM when the power is switched off?',
      options: [
        { id: 'a', text: 'It is saved forever' },
        { id: 'b', text: 'It is erased' },
        { id: 'c', text: 'It moves to the CPU' },
        { id: 'd', text: 'It is printed' },
      ],
    },
    {
      id: 'q3',
      text: 'Which part keeps your files when the computer is off?',
      options: [
        { id: 'a', text: 'RAM' },
        { id: 'b', text: 'CPU' },
        { id: 'c', text: 'Motherboard' },
        { id: 'd', text: 'Storage (hard disk or SSD)' },
      ],
    },
    {
      id: 'q4',
      text: 'What connects the CPU, RAM and storage together?',
      options: [
        { id: 'a', text: 'The motherboard' },
        { id: 'b', text: 'The mouse' },
        { id: 'c', text: 'The monitor' },
        { id: 'd', text: 'The speaker' },
      ],
    },
    {
      id: 'q5',
      text: 'Which of these is a storage device?',
      options: [
        { id: 'a', text: 'Monitor' },
        { id: 'b', text: 'Keyboard' },
        { id: 'c', text: 'SSD' },
        { id: 'd', text: 'Mouse' },
      ],
    },
  ],
}

// ---------- registries used by api.ts and the fake server ----------

// Look a key up in one of the registries below. Ids come from the address bar, so a key such as
// "constructor" must count as missing instead of finding something on Object.prototype.
export function pick<T>(registry: Record<string, T>, key: string | null | undefined): T | undefined {
  return key != null && Object.prototype.hasOwnProperty.call(registry, key) ? registry[key] : undefined
}

// The tab id on the Home screen -> the sample model that tab opens.
export const subjectModelIds: Record<string, string> = {
  biology: heartModel.id,
  chemistry: atomModel.id,
  physics: motorModel.id,
  cs: computerModel.id,
}

// What the mock "recognises" for each model: the label and the figure number in the book.
export const mockFigures: Record<string, { label: string; figure: string }> = {
  [heartModel.id]: { label: 'Human heart', figure: 'Fig 9.4' },
  [atomModel.id]: { label: 'Carbon atom', figure: 'Fig 4.2' },
  [motorModel.id]: { label: 'Electric motor', figure: 'Fig 14.6' },
  [computerModel.id]: { label: 'Inside a computer', figure: 'Fig 2.1' },
}

export const mockModels: Record<string, ModelInfo> = {
  [heartModel.id]: heartModel,
  [atomModel.id]: atomModel,
  [motorModel.id]: motorModel,
  [computerModel.id]: computerModel,
}

export const mockContents: Record<string, ModelContent> = {
  [heartContent.modelId]: heartContent,
  [atomContent.modelId]: atomContent,
  [motorContent.modelId]: motorContent,
  [computerContent.modelId]: computerContent,
}

export const mockQuizzes: Record<string, Quiz> = {
  [heartQuiz.modelId]: heartQuiz,
  [atomQuiz.modelId]: atomQuiz,
  [motorQuiz.modelId]: motorQuiz,
  [computerQuiz.modelId]: computerQuiz,
}

export const mockBooks: Record<string, AskSource> = {
  [heartModel.id]: heartBook,
  [atomModel.id]: atomBook,
  [motorModel.id]: motorBook,
  [computerModel.id]: computerBook,
}
