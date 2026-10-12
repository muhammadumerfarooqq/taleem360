// PRIVATE to the mock. This stands in for the server's answer key.
// Screens never import this file: only mock/server.ts (the fake server) does.
// In the real design the key stays on the server and is never sent before submitting.

export interface KeyEntry {
  correctOptionId: string
  topic: string
}

export const answerKeys: Record<string, Record<string, KeyEntry>> = {
  quiz_heart_v1: {
    q1: { correctOptionId: 'c', topic: 'Chambers of the heart' },
    q2: { correctOptionId: 'b', topic: 'Aorta and its role' },
    q3: { correctOptionId: 'c', topic: 'Heart valves' },
    q4: { correctOptionId: 'b', topic: 'Arteries and veins' },
    q5: { correctOptionId: 'c', topic: 'Pulmonary trunk' },
  },
}
