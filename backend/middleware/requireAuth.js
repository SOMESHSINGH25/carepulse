import { getAdminAuth } from '../config/firebaseAdmin.js'

export async function requireAuth(request, response, next) {
  const authorization = request.get('authorization')
  const match = authorization?.match(/^Bearer\s+(.+)$/i)

  if (!match) {
    return response.status(401).json({ error: 'Authentication required.' })
  }

  try {
    request.user = await getAdminAuth().verifyIdToken(match[1])
    return next()
  } catch (error) {
    if (typeof error?.code === 'string' && error.code.startsWith('auth/')) {
      return response.status(401).json({ error: 'Invalid or expired token.' })
    }

    return next(error)
  }
}
