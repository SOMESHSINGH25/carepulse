import cors from 'cors'
import express from 'express'
import apiRouter from './routes/apiRoutes.js'

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use('/api', apiRouter)

app.use((error, _request, response, _next) => {
  const status = Number.isInteger(error?.status) ? error.status : 500
  const message =
    status === 503 || status < 500 ? error.message : 'Internal server error.'
  if (status >= 500) {
    console.error('Unhandled API error:', error)
  }
  response.status(status).json({ error: message })
})

export default app
