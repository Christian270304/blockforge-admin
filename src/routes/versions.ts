import { Hono } from 'hono'


type Bindings = {
    DB: D1Database
}


export const versions = new Hono<{
    Bindings: Bindings
}>()


// ============================================================
// GET VERSIONS
// ============================================================

versions.get('/:modpackId/versions', async (c) => {

    const modpackId =
        Number(c.req.param('modpackId'))


    const result = await c.env.DB
        .prepare(`
            SELECT
                id,
                modpack_id,
                version,
                minecraft_version,
                loader,
                loader_version,
                status,
                changelog,
                created_at,
                updated_at

            FROM modpack_versions

            WHERE modpack_id = ?

            ORDER BY id DESC
        `)
        .bind(modpackId)
        .all()


    return c.json({
        versions: result.results
    })
})


// ============================================================
// CREATE VERSION
// ============================================================

versions.post('/:modpackId/versions', async (c) => {

    const modpackId =
        Number(c.req.param('modpackId'))


    const body = await c.req.json()


    const version =
        String(body.version || '').trim()

    const minecraftVersion =
        String(body.minecraftVersion || '').trim()

    const loader =
        String(body.loader || '').trim().toLowerCase()

    const loaderVersion =
        String(body.loaderVersion || '').trim()

    const status =
        body.status === 'published'
            ? 'published'
            : 'draft'

    const changelog =
        String(body.changelog || '').trim()


    if (
        !version ||
        !minecraftVersion ||
        !loader ||
        !loaderVersion
    ) {

        return c.json(
            {
                error:
                    'Faltan campos obligatorios'
            },
            400
        )
    }


    // Comprobar que existe el modpack

    const modpack = await c.env.DB
        .prepare(`
            SELECT id
            FROM modpacks
            WHERE id = ?
        `)
        .bind(modpackId)
        .first()


    if (!modpack) {

        return c.json(
            {
                error: 'Modpack no encontrado'
            },
            404
        )
    }


    try {

        const result = await c.env.DB
            .prepare(`
                INSERT INTO modpack_versions (
                    modpack_id,
                    version,
                    minecraft_version,
                    loader,
                    loader_version,
                    status,
                    changelog
                )

                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                modpackId,
                version,
                minecraftVersion,
                loader,
                loaderVersion,
                status,
                changelog
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

        return c.json(
            {
                error:
                    'Ya existe esa versión en el modpack'
            },
            409
        )
    }
})


// ============================================================
// UPDATE VERSION
// ============================================================

versions.put(
    '/:modpackId/versions/:versionId',
    async (c) => {

        const modpackId =
            Number(c.req.param('modpackId'))

        const versionId =
            Number(c.req.param('versionId'))

        const body =
            await c.req.json()


        const version =
            String(body.version || '').trim()

        const minecraftVersion =
            String(body.minecraftVersion || '').trim()

        const loader =
            String(body.loader || '')
                .trim()
                .toLowerCase()

        const loaderVersion =
            String(body.loaderVersion || '').trim()

        const status =
            body.status === 'published'
                ? 'published'
                : 'draft'

        const changelog =
            String(body.changelog || '').trim()


        if (
            !version ||
            !minecraftVersion ||
            !loader ||
            !loaderVersion
        ) {

            return c.json(
                {
                    error:
                        'Faltan campos obligatorios'
                },
                400
            )
        }


        const result = await c.env.DB
            .prepare(`
                UPDATE modpack_versions

                SET
                    version = ?,
                    minecraft_version = ?,
                    loader = ?,
                    loader_version = ?,
                    status = ?,
                    changelog = ?,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
                AND modpack_id = ?
            `)
            .bind(
                version,
                minecraftVersion,
                loader,
                loaderVersion,
                status,
                changelog,
                versionId,
                modpackId
            )
            .run()


        if (result.meta.changes === 0) {

            return c.json(
                {
                    error:
                        'Versión no encontrada'
                },
                404
            )
        }


        return c.json({
            success: true
        })
    }
)


// ============================================================
// DELETE VERSION
// ============================================================

versions.delete(
    '/:modpackId/versions/:versionId',
    async (c) => {

        const modpackId =
            Number(c.req.param('modpackId'))

        const versionId =
            Number(c.req.param('versionId'))


        const result = await c.env.DB
            .prepare(`
                DELETE FROM modpack_versions

                WHERE id = ?
                AND modpack_id = ?
            `)
            .bind(
                versionId,
                modpackId
            )
            .run()


        if (result.meta.changes === 0) {

            return c.json(
                {
                    error:
                        'Versión no encontrada'
                },
                404
            )
        }


        return c.json({
            success: true
        })
    }
)