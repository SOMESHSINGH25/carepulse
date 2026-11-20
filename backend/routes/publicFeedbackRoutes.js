import { Router } from 'express'
import {
  createPublicFeedback,
  readPublicFeedbackLink,
} from '../controllers/publicFeedbackController.js'

const publicFeedbackRouter = Router()

publicFeedbackRouter.get('/:token', readPublicFeedbackLink)
publicFeedbackRouter.post('/:token', createPublicFeedback)

export default publicFeedbackRouter
