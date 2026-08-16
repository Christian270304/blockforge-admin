import type { MiddlewareHandler } from 'hono'

import {
    getCookie
} from 'hono/cookie'

import {
    sha256
} from '../utils/auth'


type Bindings = {
    DB: D1Database
}


export const requireAuth:
MiddlewareHandler<{
    Bindings: Bindings
}> = async (c, next) => {

    const token =
        getCookie(
            c,
            'blockforge_session'
        )


    if (!token) {

        return c.json(
            {
                error: 'No autorizado'
            },
            401
        )
    }


    const tokenHash =
        await sha256(token)


    const session = await c.env.DB
        .prepare(`
            SELECT
                sessions.id,
                sessions.user_id,
                sessions.expires_at,
                users.email

            FROM sessions

            INNER JOIN users
                ON users.id = sessions.user_id

            WHERE sessions.token_hash = ?
        `)
        .bind(tokenHash)
        .first<{
            id: number
            user_id: number
            expires_at: string
            email: string
        }>()


    if (!session) {

        return c.json(
            {
                error: 'No autorizado'
            },
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
            {
                error: 'Sesión expirada'
            },
            401
        )
    }


    await next()
}