import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { timeout } from 'hono/timeout'
import auth from '@/server/routers/auth'
import bridge from '@/server/routers/bridge'

export const runtime = 'nodejs'
export const maxDuration = 30

const app = new Hono().basePath('/api')

app.use(compress(), cors(), timeout(20000))

app.route('/auth', auth)
app.route('/', bridge)

export const GET = handle(app)
export const POST = handle(app)
