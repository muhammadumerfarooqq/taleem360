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

// ---------- Physics: electricity generator ----------

export const generatorModel: ModelInfo = {
  id: 'generator',
  title: 'Electricity generator',
  titleUr: 'برقی جنریٹر',
  subject: 'Physics',
  classLevel: 9,
  chapter: 'Ch 11 Induction',
  glbUrl: '',
  glbExpiresAt: '2099-01-01T00:00:00Z',
  glbSizeBytes: 0,
  version: 1,
  hotspots: [
    { partId: 'magnet', position: '-0.30m 0.05m 0m', normal: '0m 1m 0m' },
    { partId: 'coil', position: '0m 0.18m 0m', normal: '0m 1m 0m' },
    { partId: 'slip-rings', position: '0.1m -0.2m 0m', normal: '0m 1m 0m' },
    { partId: 'brushes', position: '0.2m -0.2m 0m', normal: '0m 1m 0m' },
    { partId: 'bulb', position: '0.25m -0.45m 0.4m', normal: '0m 1m 0m' },
  ],
}

export const generatorBook: AskSource = {
  book: 'Class 9 Physics',
  chapter: 'Ch 11 Induction',
  page: 140,
}

export const generatorContent: ModelContent = {
  modelId: 'generator',
  source: { book: 'Class 9 Physics', chapter: 'Ch 11 Induction', pages: '138-141' },
  defaultPartId: 'coil',
  parts: [
    {
      id: 'magnet',
      nameEn: 'Magnet',
      nameUr: 'مقناطیس',
      textEn:
        'The north and south poles make a magnetic field. The coil turns inside this field, and that is how the generator makes electricity.',
      textUr:
        'شمالی اور جنوبی قطب مقناطیسی میدان بناتے ہیں۔ کوائل اسی میدان کے اندر گھومتی ہے، اور اسی طرح جنریٹر بجلی بناتا ہے۔',
      audioEnUrl: '/audio/generator/magnet-en.mp3',
      audioUrUrl: '/audio/generator/magnet-ur.mp3',
      color: '#E0566F',
    },
    {
      id: 'coil',
      nameEn: 'Coil',
      nameUr: 'کوائل',
      textEn:
        'A loop of wire that you turn with the handle. As it spins in the magnetic field, a current is made in the wire. The current changes direction every half turn.',
      textUr:
        'تار کا ایک لچھا جسے ہتھے سے گھمایا جاتا ہے۔ مقناطیسی میدان میں گھومنے سے تار میں برقی رو پیدا ہوتی ہے۔ ہر آدھے چکر کے بعد رو کی سمت بدل جاتی ہے۔',
      audioEnUrl: '/audio/generator/coil-en.mp3',
      audioUrUrl: '/audio/generator/coil-ur.mp3',
      color: '#FFB020',
    },
    {
      id: 'slip-rings',
      nameEn: 'Slip rings',
      nameUr: 'سلپ رنگز',
      textEn:
        'Two rings fixed to the ends of the coil. They spin with the coil and keep it connected to the outside circuit while it turns.',
      textUr:
        'کوائل کے سروں سے جڑے ہوئے دو چھلے۔ یہ کوائل کے ساتھ گھومتے ہیں اور گھومتے وقت اسے بیرونی سرکٹ سے جوڑے رکھتے ہیں۔',
      audioEnUrl: '/audio/generator/slip-rings-en.mp3',
      audioUrUrl: '/audio/generator/slip-rings-ur.mp3',
      color: '#14B8A6',
    },
    {
      id: 'brushes',
      nameEn: 'Brushes',
      nameUr: 'برش',
      textEn:
        'Fixed carbon contacts that press on the slip rings. They pick up the current from the spinning coil and pass it to the wires and the bulb.',
      textUr:
        'کاربن کے ساکن رابطے جو سلپ رنگز سے لگے رہتے ہیں۔ یہ گھومتی ہوئی کوائل سے برقی رو لے کر تاروں اور بلب تک پہنچاتے ہیں۔',
      audioEnUrl: '/audio/generator/brushes-en.mp3',
      audioUrUrl: '/audio/generator/brushes-ur.mp3',
      color: '#5B86F0',
    },
    {
      id: 'bulb',
      nameEn: 'Bulb',
      nameUr: 'بلب',
      textEn:
        'The bulb lights up when current flows through it. It shows that turning the coil in a magnetic field makes electricity. Turn faster and it glows brighter.',
      textUr:
        'جب بلب میں سے برقی رو گزرتی ہے تو وہ روشن ہو جاتا ہے۔ اس سے ثابت ہوتا ہے کہ مقناطیسی میدان میں کوائل گھمانے سے بجلی بنتی ہے۔ کوائل جتنی تیز گھمائیں، بلب اتنا زیادہ روشن ہوتا ہے۔',
      audioEnUrl: '/audio/generator/bulb-en.mp3',
      audioUrUrl: '/audio/generator/bulb-ur.mp3',
      color: '#EC4899',
    },
  ],
}

export const generatorQuiz: Quiz = {
  quizId: 'quiz_generator_v1',
  modelId: 'generator',
  questions: [
    {
      id: 'q1',
      text: 'What does an electricity generator change into electrical energy?',
      options: [
        { id: 'a', text: 'Light energy' },
        { id: 'b', text: 'Chemical energy' },
        { id: 'c', text: 'Kinetic energy (motion)' },
        { id: 'd', text: 'Sound energy' },
      ],
    },
    {
      id: 'q2',
      text: 'What makes the current in the coil of a generator?',
      options: [
        { id: 'a', text: 'A battery inside the coil' },
        { id: 'b', text: 'The coil turning in a magnetic field' },
        { id: 'c', text: 'Heat from the bulb' },
        { id: 'd', text: 'Light falling on the coil' },
      ],
    },
    {
      id: 'q3',
      text: 'What do the brushes do?',
      options: [
        { id: 'a', text: 'Make the magnetic field' },
        { id: 'b', text: 'Turn the coil' },
        { id: 'c', text: 'Pick up current from the slip rings' },
        { id: 'd', text: 'Cool the bulb' },
      ],
    },
    {
      id: 'q4',
      text: 'How can you make the bulb glow brighter?',
      options: [
        { id: 'a', text: 'Turn the coil more slowly' },
        { id: 'b', text: 'Use a weaker magnet' },
        { id: 'c', text: 'Take the bulb out' },
        { id: 'd', text: 'Turn the coil faster' },
      ],
    },
    {
      id: 'q5',
      text: 'What is the job of the slip rings?',
      options: [
        { id: 'a', text: 'Keep the coil connected to the circuit while it spins' },
        { id: 'b', text: 'Make the magnetic field' },
        { id: 'c', text: 'Light the bulb' },
        { id: 'd', text: 'Store charge' },
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
  physics: generatorModel.id,
  cs: computerModel.id,
}

// What the mock "recognises" for each model: the label and the figure number in the book.
export const mockFigures: Record<string, { label: string; figure: string }> = {
  [heartModel.id]: { label: 'Human heart', figure: 'Fig 9.4' },
  [atomModel.id]: { label: 'Carbon atom', figure: 'Fig 4.2' },
  [generatorModel.id]: { label: 'Electricity generator', figure: 'Fig 11.1' },
  [computerModel.id]: { label: 'Inside a computer', figure: 'Fig 2.1' },
}

export const mockModels: Record<string, ModelInfo> = {
  [heartModel.id]: heartModel,
  [atomModel.id]: atomModel,
  [generatorModel.id]: generatorModel,
  [computerModel.id]: computerModel,
}

export const mockContents: Record<string, ModelContent> = {
  [heartContent.modelId]: heartContent,
  [atomContent.modelId]: atomContent,
  [generatorContent.modelId]: generatorContent,
  [computerContent.modelId]: computerContent,
}

export const mockQuizzes: Record<string, Quiz> = {
  [heartQuiz.modelId]: heartQuiz,
  [atomQuiz.modelId]: atomQuiz,
  [generatorQuiz.modelId]: generatorQuiz,
  [computerQuiz.modelId]: computerQuiz,
}

export const mockBooks: Record<string, AskSource> = {
  [heartModel.id]: heartBook,
  [atomModel.id]: atomBook,
  [generatorModel.id]: generatorBook,
  [computerModel.id]: computerBook,
}
