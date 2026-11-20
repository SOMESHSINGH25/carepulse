import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import app from '../app.js'

let server
let baseUrl

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
})

test('health endpoint is available without Firebase credentials', async () => {
  const response = await fetch(`${baseUrl}/api/health`)

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    status: 'ok',
    service: 'carepulse-api',
  })
})

test('admin endpoints reject requests without a Firebase ID token', async () => {
  const response = await fetch(`${baseUrl}/api/admin/dashboard`)

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), {
    error: 'Authentication required.',
  })
})

test('public feedback route accepts no login but validates ratings', async () => {
  const response = await fetch(`${baseUrl}/api/public/feedback/example-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: 'A response without ratings' }),
  })

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'Please provide all four ratings from 1 to 5.',
  })
})

test('public feedback rejects out-of-range ratings and NPS values', async () => {
  const ratings = {
    punctuality: 5,
    qualityOfCare: 4,
    hygiene: 5,
    behaviour: 4,
  }
  const invalidRatings = await fetch(
    `${baseUrl}/api/public/feedback/example-token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ratings: { ...ratings, hygiene: 6 },
        npsScore: 9,
        comment: '',
      }),
    },
  )
  assert.equal(invalidRatings.status, 400)

  const invalidNps = await fetch(
    `${baseUrl}/api/public/feedback/example-token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratings, npsScore: 11, comment: '' }),
    },
  )
  assert.equal(invalidNps.status, 400)
})
