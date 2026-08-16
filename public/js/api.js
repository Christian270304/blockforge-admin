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