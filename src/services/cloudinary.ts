// ============================================================
// BLOCKFORGE — CLOUDINARY SERVICE
// ============================================================

export type CloudinaryBindings = {
    CLOUDINARY_CLOUD_NAME: string
    CLOUDINARY_API_KEY: string
    CLOUDINARY_API_SECRET: string
}


export type CloudinaryUploadResult = {
    publicId: string
    url: string
    bytes: number
    format: string | null
    originalFilename: string | null
}


// ============================================================
// SHA-1
// Cloudinary utiliza SHA-1 para firmar las peticiones.
// ============================================================

async function sha1(text: string): Promise<string> {

    const data =
        new TextEncoder().encode(text)

    const digest =
        await crypto.subtle.digest(
            'SHA-1',
            data
        )

    return Array
        .from(new Uint8Array(digest))
        .map(byte =>
            byte
                .toString(16)
                .padStart(2, '0')
        )
        .join('')
}


// ============================================================
// UPLOAD RAW FILE
// ============================================================

export async function uploadRawFile(
    env: CloudinaryBindings,
    file: File,
    folder: string
): Promise<CloudinaryUploadResult> {

    const timestamp =
        Math.floor(Date.now() / 1000)


    // Nombre original sin .jar
    const publicId =
        file.name.replace(/\.jar$/i, '')


    // ========================================================
    // PARÁMETROS FIRMADOS
    // ========================================================

    const paramsToSign = {
        folder,
        public_id: publicId,
        timestamp
    }


    const signatureString =
        Object
            .entries(paramsToSign)
            .sort(([a], [b]) =>
                a.localeCompare(b)
            )
            .map(([key, value]) =>
                `${key}=${value}`
            )
            .join('&')
        +
        env.CLOUDINARY_API_SECRET


    const signature =
        await sha1(signatureString)


    // ========================================================
    // FORM DATA
    // ========================================================

    const formData =
        new FormData()


    formData.append(
        'file',
        file
    )

    formData.append(
        'api_key',
        env.CLOUDINARY_API_KEY
    )

    formData.append(
        'timestamp',
        String(timestamp)
    )

    formData.append(
        'folder',
        folder
    )

    formData.append(
        'public_id',
        publicId
    )

    formData.append(
        'signature',
        signature
    )


    // ========================================================
    // CLOUDINARY REQUEST
    // ========================================================

    const endpoint =
        `https://api.cloudinary.com/v1_1/${
            env.CLOUDINARY_CLOUD_NAME
        }/raw/upload`


    const response =
        await fetch(
            endpoint,
            {
                method: 'POST',
                body: formData
            }
        )


    const data: any =
        await response.json()


    if (!response.ok) {

        console.error(
            'Cloudinary upload error:',
            data
        )


        throw new Error(
            data?.error?.message ||
            `Cloudinary respondió ${response.status}`
        )
    }


    return {

        publicId:
            data.public_id,

        url:
            data.secure_url,

        bytes:
            data.bytes || file.size,

        format:
            data.format || null,

        originalFilename:
            file.name
    }
}