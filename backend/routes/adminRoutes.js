import { Router } from 'express'
import {
  createLink,
  exportFeedbackCsv,
  readDashboard,
} from '../controllers/adminController.js'
import { requireAuth } from '../middleware/requireAuth.js'

const adminRouter = Router()

adminRouter.use(requireAuth)
adminRouter.get('/dashboard', readDashboard)
adminRouter.post('/feedback-links', createLink)
adminRouter.get('/feedback/export.csv', exportFeedbackCsv)

export default adminRouter
