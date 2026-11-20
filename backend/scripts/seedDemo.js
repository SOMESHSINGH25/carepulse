import 'dotenv/config'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../config/firebaseAdmin.js'

const nurses = ['Amara Lewis', 'Daniel Shah', 'Priya Okafor', 'Oliver Chen']
const ratings = [
  [5, 5, 5, 5],
  [4, 5, 4, 5],
  [5, 4, 5, 4],
  [3, 3, 4, 4],
  [2, 3, 3, 4],
  [4, 4, 5, 4],
  [1, 2, 3, 3],
  [5, 5, 4, 5],
  [4, 4, 4, 4],
  [3, 2, 3, 3],
]
const npsScores = [10, 9, 10, 8, 7, 9, 5, 10, 8, 6]
const comments = [
  'Arrived on time and explained each step with patience.',
  'Very kind and respectful. Mum felt comfortable throughout the visit.',
  'The visit went well; a little more notice about arrival time would help.',
  'Care was thorough and the home was left tidy.',
  'We would appreciate a clearer update after the next visit.',
  'Professional, gentle, and attentive to our questions.',
]

async function seedDemoData() {
  const firestore = getAdminFirestore()
  const collection = firestore.collection('feedback')
  const existing = await collection.where('synthetic', '==', true).get()
  const deleteBatch = firestore.batch()
  existing.docs.forEach((document) => deleteBatch.delete(document.ref))
  if (!existing.empty) {
    await deleteBatch.commit()
  }

  const batch = firestore.batch()
  const now = Date.now()
  for (let index = 0; index < 24; index += 1) {
    const visitDay = new Date(
      now - ((index * 7) % 29) * 24 * 60 * 60 * 1000,
    )
    const profile = ratings[index % ratings.length]
    batch.set(collection.doc(`demo-feedback-${String(index + 1).padStart(2, '0')}`), {
      nurseName: nurses[index % nurses.length],
      visitDate: visitDay.toISOString().slice(0, 10),
      ratings: {
        punctuality: profile[0],
        qualityOfCare: profile[1],
        hygiene: profile[2],
        behaviour: profile[3],
      },
      npsScore: npsScores[index % npsScores.length],
      comment: comments[index % comments.length],
      abusive: false,
      synthetic: true,
      submittedAt: Timestamp.fromDate(visitDay),
    })
  }

  await batch.commit()
  console.log('Seeded 24 clearly labelled synthetic feedback records.')
}

seedDemoData().catch((error) => {
  console.error('Unable to seed demo feedback:', error)
  process.exitCode = 1
})
