// Sample data only, shaped exactly like the responses in docs/API.md.
// Names and scores are not real. The quiz answer key is NOT here (see answerKey.ts).
import type {
  AskSource,
  HomeData,
  Me,
  ModelContent,
  ModelInfo,
  Quiz,
  TeacherClass,
  TeacherResults,
} from '../types'

export const mockMe: Me = {
  uid: 'uid_mock_student',
  name: 'Ayesha',
  role: 'student',
  classLevel: 9,
  classId: '9a',
}

export const homeData: HomeData = {
  student: { name: 'Ayesha', classLevel: 9 },
  subjects: [
    { id: 'biology', name: 'Biology', examples: 'Heart, lungs, cell' },
    { id: 'chemistry', name: 'Chemistry', examples: 'Atom, molecules' },
    { id: 'physics', name: 'Physics', examples: 'Motor, turbine' },
    { id: 'cs', name: 'Computer Science', examples: 'Hardware, logic' },
  ],
  recent: [{ modelId: 'heart', title: 'Human heart', subject: 'Biology', chapter: 'Ch 9 Transport' }],
}

export const heartModel: ModelInfo = {
  id: 'heart',
  title: 'Human heart',
  titleUr: 'انسانی دل',
  subject: 'Biology',
  classLevel: 9,
  chapter: 'Ch 9 Transport',
  glbUrl: '', // no real model yet (step 2)
  glbExpiresAt: '2099-01-01T00:00:00Z',
  glbSizeBytes: 0,
  version: 1,
  hotspots: [
    { partId: 'veins', position: '-0.10m 0.30m 0.00m', normal: '0m 1m 0m' },
    { partId: 'pulmonary-trunk', position: '0.20m 0.20m 0.00m', normal: '0m 1m 0m' },
    { partId: 'valves', position: '0.00m 0.00m 0.05m', normal: '0m 0m 1m' },
    { partId: 'aorta', position: '0.10m 0.32m 0.00m', normal: '0m 1m 0m' },
  ],
}

export const heartBook: AskSource = { book: 'Class 9 Biology', chapter: 'Ch 9 Transport', page: 113 }

export const heartContent: ModelContent = {
  modelId: 'heart',
  source: { book: 'Class 9 Biology', chapter: 'Ch 9 Transport', pages: '112-114' },
  defaultPartId: 'aorta',
  parts: [
    {
      id: 'veins',
      nameEn: 'Veins',
      nameUr: 'وریدیں',
      textEn: 'Vessels that carry blood back to the heart.',
      textUr: 'وہ نالیاں جو خون کو واپس دل تک لاتی ہیں۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#5B86F0',
    },
    {
      id: 'pulmonary-trunk',
      nameEn: 'Pulmonary trunk',
      nameUr: 'پلمونری ٹرنک',
      textEn: 'Carries oxygen-poor blood from the right ventricle to the lungs.',
      textUr: 'دائیں بطن سے آکسیجن کم خون کو پھیپھڑوں تک لے جاتا ہے۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#5B86F0',
    },
    {
      id: 'valves',
      nameEn: 'Valves',
      nameUr: 'والوز',
      textEn: 'Flaps that keep blood flowing in one direction.',
      textUr: 'پردے جو خون کو ایک ہی سمت میں بہنے دیتے ہیں۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#9E2A41',
    },
    {
      id: 'aorta',
      nameEn: 'Aorta',
      nameUr: 'ابہر',
      textEn:
        'The largest artery in the body. It carries oxygen-rich blood from the left ventricle out to the whole body.',
      textUr: 'سب سے بڑی شریان، جو بائیں بطن سے آکسیجن والا خون پورے جسم تک پہنچاتی ہے۔',
      audioEnUrl: null,
      audioUrUrl: null,
      color: '#FFB020',
    },
  ],
}

// The quiz the screens see: no correct answers.
export const heartQuiz: Quiz = {
  quizId: 'quiz_heart_v1',
  modelId: 'heart',
  questions: [
    {
      id: 'q1',
      text: 'How many chambers does the human heart have?',
      options: [
        { id: 'a', text: 'Two' },
        { id: 'b', text: 'Three' },
        { id: 'c', text: 'Four' },
        { id: 'd', text: 'Five' },
      ],
    },
    {
      id: 'q2',
      text: 'Which vessel carries oxygen-rich blood from the left ventricle to the body?',
      options: [
        { id: 'a', text: 'Pulmonary trunk' },
        { id: 'b', text: 'Aorta' },
        { id: 'c', text: 'Vena cava' },
        { id: 'd', text: 'Pulmonary vein' },
      ],
    },
    {
      id: 'q3',
      text: 'What do the heart valves do?',
      options: [
        { id: 'a', text: 'Make blood oxygen-rich' },
        { id: 'b', text: 'Pump blood to the lungs' },
        { id: 'c', text: 'Keep blood flowing one way' },
        { id: 'd', text: 'Store blood' },
      ],
    },
    {
      id: 'q4',
      text: 'Which vessels carry blood back to the heart?',
      options: [
        { id: 'a', text: 'Arteries' },
        { id: 'b', text: 'Veins' },
        { id: 'c', text: 'Capillaries' },
        { id: 'd', text: 'Valves' },
      ],
    },
    {
      id: 'q5',
      text: 'Where does the pulmonary trunk send blood?',
      options: [
        { id: 'a', text: 'To the brain' },
        { id: 'b', text: 'To the body' },
        { id: 'c', text: 'To the lungs' },
        { id: 'd', text: 'To the kidneys' },
      ],
    },
  ],
}

export const teacherClasses: TeacherClass[] = [
  { id: '9a', name: 'Class 9-A', subject: 'Biology', studentCount: 32 },
  { id: '9b', name: 'Class 9-B', subject: 'Biology', studentCount: 30 },
]

export const teacherResultsByClass: Record<string, TeacherResults> = {
  '9a': {
    summary: { studentsTaken: 5, classAverage: 72, mostScannedModel: 'Heart' },
    rows: [
      { studentName: 'Zainab Ali', modelId: 'heart', score: 5, total: 5, label: 'Strong' },
      { studentName: 'Ayesha Khan', modelId: 'heart', score: 4, total: 5, label: 'Strong' },
      { studentName: 'Maryam Noor', modelId: 'heart', score: 4, total: 5, label: 'Strong' },
      { studentName: 'Hassan Raza', modelId: 'heart', score: 3, total: 5, label: 'Okay' },
      { studentName: 'Bilal Ahmed', modelId: 'heart', score: 2, total: 5, label: 'Needs help' },
    ],
    weakTopics: [
      { topic: 'Heart valves', percentCorrect: 40 },
      { topic: 'Chambers', percentCorrect: 80 },
      { topic: 'Aorta', percentCorrect: 100 },
    ],
  },
  '9b': {
    summary: { studentsTaken: 3, classAverage: 60, mostScannedModel: 'Heart' },
    rows: [
      { studentName: 'Sara Qureshi', modelId: 'heart', score: 4, total: 5, label: 'Strong' },
      { studentName: 'Omar Siddiqui', modelId: 'heart', score: 3, total: 5, label: 'Okay' },
      { studentName: 'Hina Baloch', modelId: 'heart', score: 2, total: 5, label: 'Needs help' },
    ],
    weakTopics: [
      { topic: 'Arteries and veins', percentCorrect: 33 },
      { topic: 'Heart valves', percentCorrect: 67 },
      { topic: 'Aorta', percentCorrect: 100 },
    ],
  },
}
