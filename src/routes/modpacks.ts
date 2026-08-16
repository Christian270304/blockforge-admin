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
// GET LATEST MODPACK VERSION
// ============================================================

modpacks.get('/:slug/latest', async (c) => {

    const slug =
        c.req.param('slug')

    try {

        const version =
            await c.env.DB
                .prepare(`
                    SELECT
                        mv.id,
                        mv.version,
                        mv.minecraft_version,
                        mv.loader,
                        mv.loader_version,
                        mv.created_at,

                        m.id AS modpack_id,
                        m.name AS modpack_name,
                        m.slug AS modpack_slug,
                        m.description AS modpack_description,
                        m.server_address

                    FROM modpack_versions mv

                    INNER JOIN modpacks m
                        ON m.id = mv.modpack_id

                    WHERE m.slug = ?

                    ORDER BY mv.id DESC

                    LIMIT 1
                `)
                .bind(slug)
                .first()


        if (!version) {

            return c.json(
                {
                    error:
                        'Modpack o versión no encontrados'
                },
                404
            )
        }


        return buildManifest(
            c.env.DB,
            version
        )

    } catch (error) {

        console.error(
            'Error obteniendo última versión:',
            error
        )

        return c.json(
            {
                error:
                    'No se pudo obtener la última versión'
            },
            500
        )
    }
})


// ============================================================
// GET SPECIFIC MODPACK VERSION
// ============================================================

modpacks.get(
    '/:slug/versions/:version',
    async (c) => {

        const slug =
            c.req.param('slug')

        const requestedVersion =
            c.req.param('version')


        try {

            const version =
                await c.env.DB
                    .prepare(`
                        SELECT
                            mv.id,
                            mv.version,
                            mv.minecraft_version,
                            mv.loader,
                            mv.loader_version,
                            mv.created_at,

                            m.id AS modpack_id,
                            m.name AS modpack_name,
                            m.slug AS modpack_slug,
                            m.description AS modpack_description,
                            m.server_address

                        FROM modpack_versions mv

                        INNER JOIN modpacks m
                            ON m.id = mv.modpack_id

                        WHERE
                            m.slug = ?
                            AND mv.version = ?

                        LIMIT 1
                    `)
                    .bind(
                        slug,
                        requestedVersion
                    )
                    .first()


            if (!version) {

                return c.json(
                    {
                        error:
                            'Versión no encontrada'
                    },
                    404
                )
            }


            return buildManifest(
                c.env.DB,
                version
            )

        } catch (error) {

            console.error(
                'Error obteniendo versión:',
                error
            )

            return c.json(
                {
                    error:
                        'No se pudo obtener la versión'
                },
                500
            )
        }
    }
)


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

// ============================================================
// BUILD LAUNCHER MANIFEST
// ============================================================

async function buildManifest(
    db: D1Database,
    version: any
) {

    const result =
        await db
            .prepare(`
                SELECT
                    id,
                    name,
                    filename,
                    source,
                    project_id,
                    version_id,
                    download_url,
                    storage_provider,
                    storage_id,
                    required,
                    sha256

                FROM mods

                WHERE modpack_version_id = ?

                ORDER BY name ASC
            `)
            .bind(version.id)
            .all()


    const mods =
        result.results.map(
            (mod: any) => ({

                id:
                    mod.id,

                name:
                    mod.name,

                filename:
                    mod.filename,

                url:
                    mod.download_url,

                sha256:
                    mod.sha256,

                required:
                    Boolean(mod.required),

                source:
                    mod.source
            })
        )


    return Response.json({

        modpack: {

            id:
                version.modpack_id,

            slug:
                version.modpack_slug,

            name:
                version.modpack_name,

            description:
                version.modpack_description,

            version:
                version.version,

            serverAddress:
                version.server_address
        },


        minecraft: {

            version:
                version.minecraft_version,

            loader:
                version.loader,

            loaderVersion:
                version.loader_version
        },


        mods
    })
}