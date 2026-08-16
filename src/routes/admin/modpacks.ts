import { Hono } from 'hono'
import { versions } from '../versions'


type Bindings = {
    DB: D1Database
}


export const adminModpacks = new Hono<{
    Bindings: Bindings
}>()


// ============================================================
// CREATE MODPACK
// POST /api/v1/admin/modpacks
// ============================================================

adminModpacks.post('/', async (c) => {

    try {

        const body = await c.req.json()

        const {
            name,
            slug,
            description,
            minecraftVersion,
            loader,
            loaderVersion,
            serverAddress,
            status
        } = body


        // --------------------------------------------------------
        // Validación
        // --------------------------------------------------------

        if (!name || !slug || !minecraftVersion || !loader || !loaderVersion) {
            return c.json(
                {
                    error: 'Faltan campos obligatorios'
                },
                400
            )
        }


        const allowedLoaders = [
            'forge',
            'neoforge',
            'fabric',
            'quilt'
        ]

        if (!allowedLoaders.includes(loader)) {
            return c.json(
                {
                    error: 'Loader no válido'
                },
                400
            )
        }


        const finalStatus =
            status === 'published'
                ? 'published'
                : 'draft'


        // --------------------------------------------------------
        // Comprobar slug
        // --------------------------------------------------------

        const existing = await c.env.DB
            .prepare(`
                SELECT id
                FROM modpacks
                WHERE slug = ?
            `)
            .bind(slug)
            .first()


        if (existing) {
            return c.json(
                {
                    error: 'Ya existe un modpack con ese slug'
                },
                409
            )
        }


        // --------------------------------------------------------
        // Insertar
        // --------------------------------------------------------

        const result = await c.env.DB
            .prepare(`
                INSERT INTO modpacks (
                    name,
                    slug,
                    description,
                    minecraft_version,
                    loader,
                    loader_version,
                    server_address,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                name,
                slug,
                description || null,
                minecraftVersion,
                loader,
                loaderVersion,
                serverAddress || null,
                finalStatus
            )
            .run()


        return c.json(
            {
                success: true,
                id: result.meta.last_row_id
            },
            201
        )

    } catch (error) {

        console.error(error)

        return c.json(
            {
                error: 'No se pudo crear el modpack'
            },
            500
        )
    }
})


// ============================================================
// UPDATE MODPACK
// PUT /api/v1/admin/modpacks/:id
// ============================================================

adminModpacks.put('/:id', async (c) => {

    try {

        const id = Number(c.req.param('id'))

        if (!Number.isInteger(id) || id <= 0) {
            return c.json(
                {
                    error: 'ID no válido'
                },
                400
            )
        }


        const body = await c.req.json()

        const {
            name,
            slug,
            description,
            minecraftVersion,
            loader,
            loaderVersion,
            serverAddress,
            status
        } = body


        if (!name || !slug || !minecraftVersion || !loader || !loaderVersion) {
            return c.json(
                {
                    error: 'Faltan campos obligatorios'
                },
                400
            )
        }


        const allowedLoaders = [
            'forge',
            'neoforge',
            'fabric',
            'quilt'
        ]

        if (!allowedLoaders.includes(loader)) {
            return c.json(
                {
                    error: 'Loader no válido'
                },
                400
            )
        }


        const finalStatus =
            status === 'published'
                ? 'published'
                : 'draft'


        // --------------------------------------------------------
        // Comprobar que existe
        // --------------------------------------------------------

        const existingModpack = await c.env.DB
            .prepare(`
                SELECT id
                FROM modpacks
                WHERE id = ?
            `)
            .bind(id)
            .first()


        if (!existingModpack) {
            return c.json(
                {
                    error: 'Modpack no encontrado'
                },
                404
            )
        }


        // --------------------------------------------------------
        // Evitar slug duplicado
        // --------------------------------------------------------

        const existingSlug = await c.env.DB
            .prepare(`
                SELECT id
                FROM modpacks
                WHERE slug = ?
                AND id != ?
            `)
            .bind(slug, id)
            .first()


        if (existingSlug) {
            return c.json(
                {
                    error: 'Ya existe otro modpack con ese slug'
                },
                409
            )
        }


        // --------------------------------------------------------
        // Actualizar
        // --------------------------------------------------------

        await c.env.DB
            .prepare(`
                UPDATE modpacks

                SET
                    name = ?,
                    slug = ?,
                    description = ?,
                    minecraft_version = ?,
                    loader = ?,
                    loader_version = ?,
                    server_address = ?,
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
            `)
            .bind(
                name,
                slug,
                description || null,
                minecraftVersion,
                loader,
                loaderVersion,
                serverAddress || null,
                finalStatus,
                id
            )
            .run()


        return c.json({
            success: true
        })

    } catch (error) {

        console.error(error)

        return c.json(
            {
                error: 'No se pudo actualizar el modpack'
            },
            500
        )
    }
})


// ============================================================
// DELETE MODPACK
// DELETE /api/v1/admin/modpacks/:id
// ============================================================

adminModpacks.delete('/:id', async (c) => {

    try {

        const id = Number(c.req.param('id'))

        if (!Number.isInteger(id) || id <= 0) {
            return c.json(
                {
                    error: 'ID no válido'
                },
                400
            )
        }


        const modpack = await c.env.DB
            .prepare(`
                SELECT id
                FROM modpacks
                WHERE id = ?
            `)
            .bind(id)
            .first()


        if (!modpack) {
            return c.json(
                {
                    error: 'Modpack no encontrado'
                },
                404
            )
        }


        await c.env.DB
            .prepare(`
                DELETE FROM modpacks
                WHERE id = ?
            `)
            .bind(id)
            .run()


        return c.json({
            success: true
        })

    } catch (error) {

        console.error(error)

        return c.json(
            {
                error: 'No se pudo eliminar el modpack'
            },
            500
        )
    }
})

adminModpacks.route('/', versions)