import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'

import {
    generateSessionToken,
    hashPassword,
    sha256
} from '../utils/auth'


type Bindings = {
    DB: D1Database
}


type User = {
    id: number
    email: string
    password_hash: string
    password_salt: string
}


export const auth = new Hono<{
    Bindings: Bindings
}>()


// ============================================================
// LOGIN
// ============================================================

auth.post('/login', async (c) => {

    const body = await c.req.json()

    const email =
        String(body.email || '')
            .trim()
            .toLowerCase()

    const password =
        String(body.password || '')


    if (!email || !password) {

        return c.json(
            {
                error: 'Email y contraseña obligatorios'
            },
            400
        )
    }


    const user = await c.env.DB
        .prepare(`
            SELECT
                id,
                email,
                password_hash,
                password_salt

            FROM users

            WHERE email = ?
        `)
        .bind(email)
        .first<User>()


    if (!user) {

        return c.json(
            {
                error: 'Credenciales incorrectas'
            },
            401
        )
    }


    const suppliedHash =
        await hashPassword(
            password,
            user.password_salt
        )


    if (suppliedHash !== user.password_hash) {

        return c.json(
            {
                error: 'Credenciales incorrectas'
            },
            401
        )
    }


    // --------------------------------------------------------
    // Crear sesión
    // --------------------------------------------------------

    const token =
        generateSessionToken()

    const tokenHash =
        await sha256(token)


    const expiresAt =
        new Date(
            Date.now() +
            7 * 24 * 60 * 60 * 1000
        ).toISOString()


    await c.env.DB
        .prepare(`
            INSERT INTO sessions (
                user_id,
                token_hash,
                expires_at
            )

            VALUES (?, ?, ?)
        `)
        .bind(
            user.id,
            tokenHash,
            expiresAt
        )
        .run()


    // --------------------------------------------------------
    // Cookie
    // --------------------------------------------------------

    const secure =
        new URL(c.req.url).protocol === 'https:'


    const cookie = [
        `blockforge_session=${token}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        'Max-Age=604800',

        ...(secure
            ? ['Secure']
            : [])
    ].join('; ')


    c.header(
        'Set-Cookie',
        cookie
    )


    return c.json({
        success: true,
        user: {
            id: user.id,
            email: user.email
        }
    })
})

// ============================================================
// CURRENT USER
// GET /api/v1/auth/me
// ============================================================

auth.get('/me', async (c) => {

    const token = getCookie(
        c,
        'blockforge_session'
    )

    if (!token) {
        return c.json(
            { authenticated: false },
            401
        )
    }

    const tokenHash = await sha256(token)

    const session = await c.env.DB
        .prepare(`
            SELECT
                sessions.id,
                sessions.expires_at,
                users.id AS user_id,
                users.email

            FROM sessions

            INNER JOIN users
                ON users.id = sessions.user_id

            WHERE sessions.token_hash = ?
        `)
        .bind(tokenHash)
        .first<{
            id: number
            expires_at: string
            user_id: number
            email: string
        }>()

    if (!session) {
        return c.json(
            { authenticated: false },
            401
        )
    }

    if (
        new Date(session.expires_at).getTime()
        <= Date.now()
    ) {

        await c.env.DB
            .prepare(`
                DELETE FROM sessions
                WHERE id = ?
            `)
            .bind(session.id)
            .run()

        return c.json(
            { authenticated: false },
            401
        )
    }

    return c.json({
        authenticated: true,

        user: {
            id: session.user_id,
            email: session.email
        }
    })
})

// ============================================================
// LOGOUT
// POST /api/v1/auth/logout
// ============================================================

auth.post('/logout', async (c) => {

    const token = getCookie(
        c,
        'blockforge_session'
    )

    if (token) {

        const tokenHash = await sha256(token)

        await c.env.DB
            .prepare(`
                DELETE FROM sessions
                WHERE token_hash = ?
            `)
            .bind(tokenHash)
            .run()
    }

    c.header(
        'Set-Cookie',
        [
            'blockforge_session=',
            'Path=/',
            'HttpOnly',
            'SameSite=Strict',
            'Max-Age=0'
        ].join('; ')
    )

    return c.json({
        success: true
    })
})