import { Router } from 'express'
import { getHealth } from '../controllers/healthController.js'
import adminRouter from './adminRoutes.js'
import publicFeedbackRouter from './publicFeedbackRoutes.js'

const apiRouter = Router()

apiRouter.get('/health', getHealth)
apiRouter.use('/public/feedback', publicFeedbackRouter)
apiRouter.use('/admin', adminRouter)

export default apiRouter
