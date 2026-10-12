// Sample data only. Names and scores are not real.
export interface Student {
  id: string
  name: string
  classLevel: number
  email: string
}

export interface ModelPart {
  id: string
  name: string
  nameUr: string
  description: string
  descriptionUr: string
}

export interface ModelInfo {
  id: string
  title: string
  subject: string
  chapter: string
  classLevel: number
  glbUrl: string
  parts: ModelPart[]
}

export interface RecentItem {
  modelId: string
  title: string
  subtitle: string
}

export interface Subject {
  id: string
  name: string
  topics: string
}

export interface HomeData {
  student: Student
  subjects: Subject[]
  recent: RecentItem[]
}

export interface QuizQuestion {
  id: string
  text: string
  options: string[]
  correctIndex: number
}

export interface QuizResult {
  score: number
  total: number
  strong: string[]
  review: string[]
}

export interface TeacherRow {
  student: string
  model: string
  score: number
  total: number
}

export interface TeacherResults {
  classLabel: string
  quizTitle: string
  takers: number
  classAverage: number
  mostScanned: string
  rows: TeacherRow[]
  topics: { name: string; percentCorrect: number }[]
}

export const sampleStudent: Student = {
  id: 's1',
  name: 'Ayesha',
  classLevel: 9,
  email: 'student@school.edu.pk',
}

export const heartModel: ModelInfo = {
  id: 'heart',
  title: 'Human heart',
  subject: 'Biology',
  chapter: 'Ch 9 Transport',
  classLevel: 9,
  glbUrl: '',
  parts: [
    {
      id: 'veins',
      name: 'Veins',
      nameUr: 'وریدیں',
      description: 'Vessels that carry blood back to the heart.',
      descriptionUr: 'وہ نالیاں جو خون کو واپس دل تک لاتی ہیں۔',
    },
    {
      id: 'pulmonary-trunk',
      name: 'Pulmonary trunk',
      nameUr: 'پلمونری ٹرنک',
      description: 'Carries oxygen-poor blood from the right ventricle to the lungs.',
      descriptionUr: 'دائیں بطن سے آکسیجن کم خون کو پھیپھڑوں تک لے جاتا ہے۔',
    },
    {
      id: 'valves',
      name: 'Valves',
      nameUr: 'والوز',
      description: 'Flaps that keep blood flowing in one direction.',
      descriptionUr: 'پردے جو خون کو ایک ہی سمت میں بہنے دیتے ہیں۔',
    },
    {
      id: 'aorta',
      name: 'Aorta',
      nameUr: 'ابہر',
      description:
        'The largest artery in the body. It carries oxygen-rich blood from the left ventricle out to the whole body.',
      descriptionUr: 'سب سے بڑی شریان، جو بائیں بطن سے آکسیجن والا خون پورے جسم تک پہنچاتی ہے۔',
    },
  ],
}

export const homeData: HomeData = {
  student: sampleStudent,
  subjects: [
    { id: 'biology', name: 'Biology', topics: 'Heart, lungs, cell' },
    { id: 'chemistry', name: 'Chemistry', topics: 'Atom, molecules' },
    { id: 'physics', name: 'Physics', topics: 'Motor, turbine' },
    { id: 'cs', name: 'Computer Science', topics: 'Hardware, logic' },
  ],
  recent: [{ modelId: 'heart', title: 'Human heart', subtitle: 'Biology · Ch 9 Transport' }],
}

export const heartQuiz: QuizQuestion[] = [
  {
    id: 'q1',
    text: 'How many chambers does the human heart have?',
    options: ['Two', 'Three', 'Four', 'Five'],
    correctIndex: 2,
  },
  {
    id: 'q2',
    text: 'Which vessel carries oxygen-rich blood from the left ventricle to the body?',
    options: ['Pulmonary trunk', 'Aorta', 'Vena cava', 'Pulmonary vein'],
    correctIndex: 1,
  },
  {
    id: 'q3',
    text: 'What do the heart valves do?',
    options: [
      'Make blood oxygen-rich',
      'Pump blood to the lungs',
      'Keep blood flowing one way',
      'Store blood',
    ],
    correctIndex: 2,
  },
  {
    id: 'q4',
    text: 'Which vessels carry blood back to the heart?',
    options: ['Arteries', 'Veins', 'Capillaries', 'Valves'],
    correctIndex: 1,
  },
  {
    id: 'q5',
    text: 'Where does the pulmonary trunk send blood?',
    options: ['To the brain', 'To the body', 'To the lungs', 'To the kidneys'],
    correctIndex: 2,
  },
]

export const teacherResults: TeacherResults = {
  classLabel: 'Class 9-A · Biology',
  quizTitle: 'Human heart quiz · Ch 9 Transport',
  takers: 5,
  classAverage: 72,
  mostScanned: 'Heart',
  rows: [
    { student: 'Zainab Ali', model: 'Heart', score: 5, total: 5 },
    { student: 'Ayesha Khan', model: 'Heart', score: 4, total: 5 },
    { student: 'Maryam Noor', model: 'Heart', score: 4, total: 5 },
    { student: 'Hassan Raza', model: 'Heart', score: 3, total: 5 },
    { student: 'Bilal Ahmed', model: 'Heart', score: 2, total: 5 },
  ],
  topics: [
    { name: 'Heart valves', percentCorrect: 40 },
    { name: 'Chambers', percentCorrect: 80 },
    { name: 'Aorta', percentCorrect: 100 },
  ],
}
