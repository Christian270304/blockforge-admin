const encoder = new TextEncoder()


// ============================================================
// BYTES → HEX
// ============================================================

function bytesToHex(bytes: Uint8Array): string {

    return Array
        .from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
}


// ============================================================
// HEX → BYTES
// ============================================================

function hexToBytes(hex: string): Uint8Array {

    const bytes = new Uint8Array(hex.length / 2)

    for (let i = 0; i < bytes.length; i++) {

        bytes[i] = parseInt(
            hex.substring(i * 2, i * 2 + 2),
            16
        )
    }

    return bytes
}


// ============================================================
// HASH SHA-256
// ============================================================

export async function sha256(
    value: string
): Promise<string> {

    const data = encoder.encode(value)

    const hash = await crypto.subtle.digest(
        'SHA-256',
        data
    )

    return bytesToHex(
        new Uint8Array(hash)
    )
}


// ============================================================
// GENERAR SALT
// ============================================================

export function generateSalt(): string {

    const salt = new Uint8Array(16)

    crypto.getRandomValues(salt)

    return bytesToHex(salt)
}


// ============================================================
// HASH DE CONTRASEÑA
// PBKDF2
// ============================================================

export async function hashPassword(
    password: string,
    saltHex: string
): Promise<string> {

    const keyMaterial =
        await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        )

    const derived = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',

            salt: hexToBytes(saltHex) as BufferSource,

            iterations: 210000,

            hash: 'SHA-256'
        },

        keyMaterial,

        256
    )

    return bytesToHex(
        new Uint8Array(derived)
    )
}


// ============================================================
// GENERAR TOKEN
// ============================================================

export function generateSessionToken(): string {

    const bytes = new Uint8Array(32)

    crypto.getRandomValues(bytes)

    return bytesToHex(bytes)
}