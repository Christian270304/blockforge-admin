import { Hono } from 'hono'


// ============================================================
// BINDINGS
// ============================================================

type Bindings = {
    DB: D1Database
}


// ============================================================
// ROUTER
// ============================================================

export const modpacks = new Hono<{
    Bindings: Bindings
}>()


// ============================================================
// GET ALL MODPACKS
// ============================================================

modpacks.get('/', async (c) => {

    try {

        const result = await c.env.DB
            .prepare(`
                SELECT
                    id,
                    name,
                    slug,
                    description,
                    minecraft_version,
                    loader,
                    loader_version,
                    server_address,
                    status,
                    created_at,
                    updated_at
                FROM modpacks
                ORDER BY created_at DESC
            `)
            .all()

        return c.json({
            modpacks: result.results
        })

    } catch (error) {

        console.error(error)

        return c.json(
            {
                error: 'No se pudieron obtener los modpacks'
            },
            500
        )
    }
})


// ============================================================
// GET MODPACK BY SLUG
// ============================================================

modpacks.get('/:slug', async (c) => {

    const slug = c.req.param('slug')

    try {

        const modpack = await c.env.DB
            .prepare(`
                SELECT
                    id,
                    name,
                    slug,
                    description,
                    minecraft_version,
                    loader,
                    loader_version,
                    server_address,
                    status,
                    created_at,
                    updated_at
                FROM modpacks
                WHERE slug = ?
            `)
            .bind(slug)
            .first()

        if (!modpack) {

            return c.json(
                {
                    error: 'Modpack no encontrado'
                },
                404
            )
        }

        return c.json(modpack)

    } catch (error) {

        console.error(error)

        return c.json(
            {
                error: 'No se pudo obtener el modpack'
            },
            500
        )
    }
})