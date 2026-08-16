const API = '/api/v1'


// ============================================================
// REQUEST
// ============================================================

async function request(url, options = {}) {

    const response = await fetch(`${API}${url}`, {
        credentials: 'same-origin',

        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },

        ...options
    })


    let data = null

    try {
        data = await response.json()
    } catch {
        data = null
    }


    if (!response.ok) {

        const error = new Error(
            data?.error || `HTTP ${response.status}`
        )

        error.status = response.status

        throw error
    }


    return data
}


// ============================================================
// AUTH
// ============================================================

export function login(email, password) {

    return request('/auth/login', {
        method: 'POST',

        body: JSON.stringify({
            email,
            password
        })
    })
}


export function logout() {

    return request('/auth/logout', {
        method: 'POST'
    })
}


export function getCurrentUser() {

    return request('/auth/me')
}


// ============================================================
// MODPACKS
// ============================================================

export function getModpacks() {

    return request('/modpacks')
}


export function createModpack(modpack) {

    return request('/admin/modpacks', {
        method: 'POST',
        body: JSON.stringify(modpack)
    })
}


export function updateModpack(id, modpack) {

    return request(`/admin/modpacks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(modpack)
    })
}


export function deleteModpack(id) {

    return request(`/admin/modpacks/${id}`, {
        method: 'DELETE'
    })
}

// ============================================================
// MODPACK VERSIONS
// ============================================================

export function getModpackVersions(modpackId) {
    return request(
        `/admin/modpacks/${modpackId}/versions`
    )
}


export function createModpackVersion(modpackId, version) {
    return request(
        `/admin/modpacks/${modpackId}/versions`,
        {
            method: 'POST',
            body: JSON.stringify(version)
        }
    )
}


export function updateModpackVersion(
    modpackId,
    versionId,
    version
) {
    return request(
        `/admin/modpacks/${modpackId}/versions/${versionId}`,
        {
            method: 'PUT',
            body: JSON.stringify(version)
        }
    )
}


export function deleteModpackVersion(
    modpackId,
    versionId
) {
    return request(
        `/admin/modpacks/${modpackId}/versions/${versionId}`,
        {
            method: 'DELETE'
        }
    )
}

// ============================================================
// MODRINTH
// ============================================================

export function searchModrinth(query) {

    return request(
        `/admin/modrinth/search?q=${
            encodeURIComponent(query)
        }`
    )
}


export function getModrinthVersions(
    projectId,
    minecraft,
    loader
) {

    const params =
        new URLSearchParams({
            minecraft,
            loader
        })


    return request(
        `/admin/modrinth/projects/${
            encodeURIComponent(projectId)
        }/versions?${params.toString()}`
    )
}

// ============================================================
// MODPACK MODS
// ============================================================

export function getMods(
    modpackId,
    versionId
) {

    return request(
        `/admin/modpacks/${modpackId}/versions/${versionId}/mods`
    )
}


export function createMod(
    modpackId,
    versionId,
    mod
) {

    return request(
        `/admin/modpacks/${modpackId}/versions/${versionId}/mods`,
        {
            method: 'POST',
            body: JSON.stringify(mod)
        }
    )
}


export function updateMod(
    modpackId,
    versionId,
    modId,
    mod
) {

    return request(
        `/admin/modpacks/${modpackId}/versions/${versionId}/mods/${modId}`,
        {
            method: 'PUT',
            body: JSON.stringify(mod)
        }
    )
}


export function deleteMod(
    modpackId,
    versionId,
    modId
) {

    return request(
        `/admin/modpacks/${modpackId}/versions/${versionId}/mods/${modId}`,
        {
            method: 'DELETE'
        }
    )
}