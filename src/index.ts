import { Hono } from 'hono'
import { modpacks } from './routes/modpacks'
import { adminModpacks } from './routes/admin/modpacks'
import { auth } from './routes/auth'
import { requireAuth } from './middleware/auth'

type Bindings = {
    ASSETS: Fetcher
    DB: D1Database
}

const app = new Hono<{
    Bindings: Bindings
}>()


// ============================================================
// FRONTEND
// ============================================================

app.get('/', async (c) => {
    return c.env.ASSETS.fetch(
        new URL('/index.html', c.req.url)
    )
})


// ============================================================
// API
// ============================================================

app.get('/api', (c) => {
    return c.json({
        name: 'BlockForge API',
        version: '1.0.0',
        status: 'online'
    })
})


// ============================================================
// ROUTES
// ============================================================

app.route('/api/v1/modpacks', modpacks)
app.use('/api/v1/admin/*', requireAuth)
app.route('/api/v1/admin/modpacks', adminModpacks)
app.route('/api/v1/auth', auth)

// ============================================================
// EXPORT
// ============================================================

export default app