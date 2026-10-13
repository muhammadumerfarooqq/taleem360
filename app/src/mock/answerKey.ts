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
  quiz_atom_v1: {
    q1: { correctOptionId: 'b', topic: 'Protons in carbon' },
    q2: { correctOptionId: 'c', topic: 'The nucleus' },
    q3: { correctOptionId: 'b', topic: 'Electron shells' },
    q4: { correctOptionId: 'd', topic: 'Valence electrons' },
    q5: { correctOptionId: 'c', topic: 'Particles in the nucleus' },
  },
  quiz_motor_v1: {
    q1: { correctOptionId: 'c', topic: 'Energy conversion in a motor' },
    q2: { correctOptionId: 'b', topic: 'The commutator' },
    q3: { correctOptionId: 'd', topic: 'Force on a current-carrying wire' },
    q4: { correctOptionId: 'a', topic: 'Speed of a motor' },
    q5: { correctOptionId: 'c', topic: 'Brushes' },
  },
  quiz_computer_v1: {
    q1: { correctOptionId: 'c', topic: 'The CPU' },
    q2: { correctOptionId: 'b', topic: 'RAM' },
    q3: { correctOptionId: 'd', topic: 'Storage' },
    q4: { correctOptionId: 'a', topic: 'The motherboard' },
    q5: { correctOptionId: 'c', topic: 'Storage devices' },
  },
}
