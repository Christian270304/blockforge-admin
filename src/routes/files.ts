import { Hono } from 'hono'

import {
    uploadRawFile
} from '../services/cloudinary'


type Bindings = {

    DB: D1Database

    CLOUDINARY_CLOUD_NAME: string
    CLOUDINARY_API_KEY: string
    CLOUDINARY_API_SECRET: string
}


export const files =
    new Hono<{
        Bindings: Bindings
    }>()


// 100 MB
const MAX_FILE_SIZE =
    100 * 1024 * 1024


// ============================================================
// POST /mods
// ============================================================

files.post(
    '/modpacks/:modpackId/versions/:versionId/mods',
    async c => {

        const modpackId =
            Number(
                c.req.param('modpackId')
            )

        const versionId =
            Number(
                c.req.param('versionId')
            )


        if (
            !Number.isInteger(modpackId) ||
            !Number.isInteger(versionId)
        ) {

            return c.json(
                {
                    error:
                        'Modpack o versión inválidos'
                },
                400
            )
        }


        // ====================================================
        // COMPROBAR MODPACK + VERSION
        // ====================================================

        const version =
            await c.env.DB
                .prepare(`
                    SELECT
                        mv.id,
                        mv.version,
                        m.id AS modpack_id,
                        m.slug AS modpack_slug

                    FROM modpack_versions mv

                    INNER JOIN modpacks m
                        ON m.id = mv.modpack_id

                    WHERE
                        mv.id = ?
                        AND
                        m.id = ?

                    LIMIT 1
                `)
                .bind(
                    versionId,
                    modpackId
                )
                .first<{
                    id: number
                    version: string
                    modpack_id: number
                    modpack_slug: string
                }>()


        if (!version) {

            return c.json(
                {
                    error:
                        'La versión indicada no existe'
                },
                404
            )
        }


        // ====================================================
        // LEER FORM DATA
        // ====================================================

        const body =
            await c.req.formData()


        const uploaded =
            body.get('file')


        if (
            !uploaded ||
            typeof uploaded === 'string'
        ) {

            return c.json(
                {
                    error:
                        'Debes enviar un archivo'
                },
                400
            )
        }


        const file =
            uploaded as File


        // ====================================================
        // VALIDACIONES
        // ====================================================

        if (
            !file.name
                .toLowerCase()
                .endsWith('.jar')
        ) {

            return c.json(
                {
                    error:
                        'Solo se permiten archivos .jar'
                },
                400
            )
        }


        if (file.size === 0) {

            return c.json(
                {
                    error:
                        'El archivo está vacío'
                },
                400
            )
        }


        if (
            file.size >
            MAX_FILE_SIZE
        ) {

            return c.json(
                {
                    error:
                        'El archivo supera los 100 MB'
                },
                413
            )
        }


        // ====================================================
        // SHA-256
        // ====================================================

        const bytes =
            await file.arrayBuffer()


        const sha256 =
            await calculateSHA256(bytes)


        // Volvemos a crear el File porque hemos leído
        // su ArrayBuffer.

        const uploadFile =
            new File(
                [bytes],
                file.name,
                {
                    type:
                        file.type ||
                        'application/java-archive'
                }
            )


        // ====================================================
        // CLOUDINARY FOLDER
        // ====================================================

        const folder =
            [
                'blockforge',
                'modpacks',
                sanitizePath(
                    version.modpack_slug
                ),
                sanitizePath(
                    version.version
                ),
                'mods'
            ]
            .join('/')


        // ====================================================
        // CLOUDINARY
        // ====================================================

        try {

            const cloudinary =
                await uploadRawFile(
                    c.env,
                    uploadFile,
                    folder
                )


            return c.json(
                {
                    success: true,

                    file: {

                        filename:
                            file.name,

                        size:
                            file.size,

                        sha256,

                        storageProvider:
                            'cloudinary',

                        storageId:
                            cloudinary.publicId,

                        downloadUrl:
                            cloudinary.url
                    }
                },
                201
            )


        } catch (error) {

            console.error(
                'Error subiendo archivo:',
                error
            )


            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : 'No se pudo subir el archivo'
                },
                502
            )
        }
    }
)


// ============================================================
// HELPERS
// ============================================================

async function calculateSHA256(
    buffer: ArrayBuffer
) {

    const digest =
        await crypto.subtle.digest(
            'SHA-256',
            buffer
        )


    return Array
        .from(
            new Uint8Array(digest)
        )
        .map(byte =>
            byte
                .toString(16)
                .padStart(2, '0')
        )
        .join('')
}


function sanitizePath(
    value: string
) {

    return String(value)
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9._-]+/g,
            '-'
        )
        .replace(
            /^-+|-+$/g,
            ''
        )
}