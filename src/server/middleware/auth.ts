import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { resolveSession, type Session } from '@/lib/token/resolver'

type RequestWithSession = {
  Variables: {
    session: Session
  }
}

export const authMiddleware = createMiddleware<RequestWithSession>(
  async (c, next) => {
    const header = c.req.header('Authorization')
    let accessToken: string | undefined

    if (header) {
      const [type, token] = header.split(' ')
      if (type === 'Bearer' && token) accessToken = token
    } else {
      accessToken = getCookie(c, 'Access')
    }

    const session = await resolveSession(accessToken)
    if (!session) {
      throw new HTTPException(401, {
        res: Response.json(
          {
            message: 'Unauthorized',
            cause: 'Access token is either invalid or expired',
          },
          { status: 401 },
        ),
      })
    }

    c.set('session', session)
    await next()
  },
)
