import { Hono } from 'hono'
import {
    deleteRawFile
} from '../services/cloudinary'

type Bindings = {
    DB: D1Database

    CLOUDINARY_CLOUD_NAME: string
    CLOUDINARY_API_KEY: string
    CLOUDINARY_API_SECRET: string
}

export const mods = new Hono<{
    Bindings: Bindings
}>()


// ============================================================
// GET MODS
// ============================================================

mods.get(
    '/:modpackId/versions/:versionId/mods',
    async (c) => {

        const modpackId =
            Number(c.req.param('modpackId'))

        const versionId =
            Number(c.req.param('versionId'))


        // Comprobamos que la versión pertenece al modpack

        const version = await c.env.DB
            .prepare(`
                SELECT id
                FROM modpack_versions
                WHERE id = ?
                AND modpack_id = ?
            `)
            .bind(
                versionId,
                modpackId
            )
            .first()


        if (!version) {
            return c.json(
                {
                    error: 'Versión no encontrada'
                },
                404
            )
        }


        const result = await c.env.DB
            .prepare(`
                SELECT
                    id,
                    modpack_version_id,
                    name,
                    filename,
                    source,
                    project_id,
                    version_id,
                    download_url,
                    storage_provider,
                    storage_id,
                    required,
                    sha256,
                    created_at

                FROM mods

                WHERE modpack_version_id = ?

                ORDER BY name COLLATE NOCASE ASC
            `)
            .bind(versionId)
            .all()


        return c.json({
            mods: result.results
        })
    }
)


// ============================================================
// CREATE MOD
// ============================================================

mods.post(
    '/:modpackId/versions/:versionId/mods',
    async (c) => {

        const modpackId =
            Number(c.req.param('modpackId'))

        const versionId =
            Number(c.req.param('versionId'))

        const body =
            await c.req.json()


        const name =
            String(body.name || '').trim()

        const filename =
            String(body.filename || '').trim()

        const source =
            String(body.source || '')
                .trim()
                .toLowerCase()

        const projectId =
            body.projectId
                ? String(body.projectId).trim()
                : null

        const sourceVersionId =
            body.versionId
                ? String(body.versionId).trim()
                : null

        const downloadUrl =
            body.downloadUrl
                ? String(body.downloadUrl).trim()
                : null

        const required =
            body.required === false
                ? 0
                : 1

        const sha256 =
            body.sha256
                ? String(body.sha256).trim()
                : null

        const storageProvider =
            body.storageProvider
                ? String(body.storageProvider).trim()
                : null

        const storageId =
            body.storageId
                ? String(body.storageId).trim()
                : null


        // ====================================================
        // VALIDATION
        // ====================================================

        if (!name || !filename || !source) {

            return c.json(
                {
                    error:
                        'Nombre, archivo y fuente son obligatorios'
                },
                400
            )
        }


        const validSources = [
            'modrinth',
            'storage',
            'url'
        ]


        if (!validSources.includes(source)) {

            return c.json(
                {
                    error:
                        'Fuente de mod no válida'
                },
                400
            )
        }


        if (
            source === 'modrinth' &&
            (!projectId || !sourceVersionId)
        ) {

            return c.json(
                {
                    error:
                        'Los mods de Modrinth necesitan projectId y versionId'
                },
                400
            )
        }


        if (
            source === 'storage' &&
            (
                !storageProvider ||
                !storageId ||
                !downloadUrl
            )
        ) {
            return c.json(
                {
                    error:
                        'Los archivos propios necesitan storageProvider, storageId y downloadUrl'
                },
                400
            )
        }


        if (
            source === 'url' &&
            !downloadUrl
        ) {
            return c.json(
                {
                    error:
                        'Los mods externos necesitan downloadUrl'
                },
                400
            )
        }


        // ====================================================
        // VERSION EXISTS
        // ====================================================

        const version = await c.env.DB
            .prepare(`
                SELECT id
                FROM modpack_versions
                WHERE id = ?
                AND modpack_id = ?
            `)
            .bind(
                versionId,
                modpackId
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


        // ====================================================
        // INSERT
        // ====================================================

        const result =
            await c.env.DB
                .prepare(`
                    INSERT INTO mods (
                        modpack_version_id,
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
                    )

                    VALUES (
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?
                    )
                `)
                .bind(
                    versionId,
                    name,
                    filename,
                    source,
                    projectId,
                    sourceVersionId,
                    downloadUrl,
                    storageProvider,
                    storageId,
                    required,
                    sha256
                )
                .run()


        return c.json(
            {
                success: true,
                id: result.meta.last_row_id
            },
            201
        )
    }
)


// ============================================================
// UPDATE MOD
// ============================================================

mods.put(
    '/:modpackId/versions/:versionId/mods/:modId',
    async (c) => {

        const modpackId =
            Number(c.req.param('modpackId'))

        const versionId =
            Number(c.req.param('versionId'))

        const modId =
            Number(c.req.param('modId'))

        const body =
            await c.req.json()


        const name =
            String(body.name || '').trim()

        const filename =
            String(body.filename || '').trim()

        const source =
            String(body.source || '')
                .trim()
                .toLowerCase()

        const projectId =
            body.projectId
                ? String(body.projectId).trim()
                : null

        const sourceVersionId =
            body.versionId
                ? String(body.versionId).trim()
                : null

        const downloadUrl =
            body.downloadUrl
                ? String(body.downloadUrl).trim()
                : null

        const required =
            body.required === false
                ? 0
                : 1

        const sha256 =
            body.sha256
                ? String(body.sha256).trim()
                : null


        if (!name || !filename || !source) {

            return c.json(
                {
                    error:
                        'Nombre, archivo y fuente son obligatorios'
                },
                400
            )
        }


        if (
            ![
                'modrinth',
                'storage',
                'url'
            ].includes(source)
        ) {

            return c.json(
                {
                    error: 'Fuente no válida'
                },
                400
            )
        }


        const version = await c.env.DB
            .prepare(`
                SELECT id
                FROM modpack_versions
                WHERE id = ?
                AND modpack_id = ?
            `)
            .bind(
                versionId,
                modpackId
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


        const result = await c.env.DB
            .prepare(`
                UPDATE mods

                SET
                    name = ?,
                    filename = ?,
                    source = ?,
                    project_id = ?,
                    version_id = ?,
                    download_url = ?,
                    required = ?,
                    sha256 = ?

                WHERE id = ?
                AND modpack_version_id = ?
            `)
            .bind(
                name,
                filename,
                source,
                projectId,
                sourceVersionId,
                downloadUrl,
                required,
                sha256,
                modId,
                versionId
            )
            .run()


        if (result.meta.changes === 0) {

            return c.json(
                {
                    error:
                        'Mod no encontrado'
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
// DELETE MOD
// ============================================================

mods.delete(
    '/:modpackId/versions/:versionId/mods/:modId',
    async (c) => {

        const modpackId =
            Number(c.req.param('modpackId'))

        const versionId =
            Number(c.req.param('versionId'))

        const modId =
            Number(c.req.param('modId'))


        // ====================================================
        // VALIDAR IDs
        // ====================================================

        if (
            !Number.isInteger(modpackId) ||
            !Number.isInteger(versionId) ||
            !Number.isInteger(modId)
        ) {

            return c.json(
                {
                    error:
                        'ID inválido'
                },
                400
            )
        }


        // ====================================================
        // COMPROBAR VERSIÓN
        // ====================================================
        //
        // Evitamos poder borrar un mod perteneciente
        // a una versión de otro modpack.

        const version =
            await c.env.DB
                .prepare(`
                    SELECT id

                    FROM modpack_versions

                    WHERE id = ?
                    AND modpack_id = ?
                `)
                .bind(
                    versionId,
                    modpackId
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


        // ====================================================
        // OBTENER MOD ANTES DE BORRARLO
        // ====================================================
        //
        // Necesitamos saber si está almacenado en Cloudinary.

        const mod =
            await c.env.DB
                .prepare(`
                    SELECT
                        id,
                        source,
                        storage_provider,
                        storage_id

                    FROM mods

                    WHERE id = ?
                    AND modpack_version_id = ?

                    LIMIT 1
                `)
                .bind(
                    modId,
                    versionId
                )
                .first<{
                    id: number
                    source: string
                    storage_provider: string | null
                    storage_id: string | null
                }>()


        if (!mod) {

            return c.json(
                {
                    error:
                        'Mod no encontrado'
                },
                404
            )
        }


        // ====================================================
        // ELIMINAR ARCHIVO DE CLOUDINARY
        // ====================================================
        //
        // Solo hacemos esto para archivos propios.
        //
        // Modrinth → no tocamos nada
        // URL externa → no tocamos nada
        // Cloudinary → eliminamos el archivo

        if (
            mod.source === 'storage' &&
            mod.storage_provider === 'cloudinary' &&
            mod.storage_id
        ) {

            try {

                await deleteRawFile(
                    c.env,
                    mod.storage_id
                )

            } catch (error) {

                console.error(
                    'Error eliminando archivo de Cloudinary:',
                    error
                )


                // IMPORTANTE:
                //
                // Si Cloudinary falla NO borramos D1.
                // Así podemos volver a intentarlo después.

                return c.json(
                    {
                        error:
                            'No se pudo eliminar el archivo de Cloudinary'
                    },
                    502
                )
            }
        }


        // ====================================================
        // ELIMINAR REGISTRO DE D1
        // ====================================================

        const result =
            await c.env.DB
                .prepare(`
                    DELETE FROM mods

                    WHERE id = ?
                    AND modpack_version_id = ?
                `)
                .bind(
                    modId,
                    versionId
                )
                .run()


        if (result.meta.changes === 0) {

            return c.json(
                {
                    error:
                        'No se pudo eliminar el mod'
                },
                500
            )
        }


        // ====================================================
        // RESPONSE
        // ====================================================

        return c.json({
            success: true
        })
    }
)