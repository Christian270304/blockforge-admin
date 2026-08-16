import {
    login,
    logout,
    getCurrentUser
} from './api.js'

import {
    renderModpacksPage
} from './modpacks.js'


const app = document.getElementById('app')


// ============================================================
// INIT
// ============================================================

async function init() {

    try {

        const session = await getCurrentUser()

        renderAdmin(session.user)

    } catch {

        renderLogin()

    }
}


// ============================================================
// LOGIN
// ============================================================

function renderLogin() {

    app.innerHTML = `
        <div class="login-page">

            <div class="login-decoration">
                <div class="forge-symbol">
                    BF
                </div>

                <div>
                    <div class="login-brand">
                        BlockForge
                    </div>

                    <div class="login-brand-subtitle">
                        MODPACK MANAGEMENT
                    </div>
                </div>
            </div>


            <div class="login-panel">

                <form
                    class="login-card"
                    id="loginForm"
                >

                    <div class="login-header">

                        <div class="login-logo">
                            BF
                        </div>

                        <h1>Bienvenido</h1>

                        <p>
                            Accede al panel de administración
                            de BlockForge.
                        </p>

                    </div>


                    <div class="form-group">

                        <label for="loginEmail">
                            Correo electrónico
                        </label>

                        <input
                            id="loginEmail"
                            type="email"
                            autocomplete="username"
                            placeholder="admin@blockforge.dev"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label for="loginPassword">
                            Contraseña
                        </label>

                        <input
                            id="loginPassword"
                            type="password"
                            autocomplete="current-password"
                            placeholder="••••••••••••"
                            required
                        >

                    </div>


                    <div
                        id="loginError"
                        class="form-error"
                    ></div>


                    <button
                        class="primary-button login-button"
                        type="submit"
                    >
                        Iniciar sesión
                    </button>

                </form>

            </div>

        </div>
    `


    document
        .getElementById('loginForm')
        .addEventListener(
            'submit',
            handleLogin
        )
}


async function handleLogin(event) {

    event.preventDefault()


    const email =
        document
            .getElementById('loginEmail')
            .value
            .trim()


    const password =
        document
            .getElementById('loginPassword')
            .value


    const error =
        document.getElementById('loginError')


    const button =
        event.currentTarget
            .querySelector('button')


    error.textContent = ''

    button.disabled = true
    button.textContent = 'Entrando...'


    try {

        const result =
            await login(
                email,
                password
            )


        renderAdmin(result.user)

    } catch (err) {

        error.textContent =
            err.status === 401
                ? 'Correo o contraseña incorrectos.'
                : 'No se pudo iniciar sesión.'


        button.disabled = false
        button.textContent = 'Iniciar sesión'
    }
}


// ============================================================
// ADMIN
// ============================================================

function renderAdmin(user) {

    app.innerHTML = `

        <div class="admin-layout">

            <!-- SIDEBAR -->

            <aside class="sidebar">

                <div class="sidebar-brand">

                    <div class="brand-icon">
                        BF
                    </div>

                    <div>
                        <div class="brand-name">
                            BlockForge
                        </div>

                        <div class="brand-label">
                            ADMIN
                        </div>
                    </div>

                </div>


                <nav class="sidebar-nav">

                    <button
                        class="nav-item active"
                        data-page="modpacks"
                    >
                        <span class="nav-icon">◫</span>
                        Modpacks
                    </button>

                    <button
                        class="nav-item"
                        disabled
                    >
                        <span class="nav-icon">◇</span>
                        Storage

                        <span class="soon">
                            PRONTO
                        </span>
                    </button>

                </nav>


                <div class="sidebar-footer">

                    <div class="admin-user">

                        <div class="user-avatar">
                            ${getInitial(user.email)}
                        </div>

                        <div class="user-data">

                            <span class="user-name">
                                Administrador
                            </span>

                            <span class="user-email">
                                ${escapeHTML(user.email)}
                            </span>

                        </div>

                    </div>


                    <button
                        class="logout-button"
                        id="logoutButton"
                        title="Cerrar sesión"
                    >
                        ↪
                    </button>

                </div>

            </aside>


            <!-- CONTENT -->

            <main class="admin-main">

                <div
                    id="pageContent"
                    class="page-content"
                ></div>

            </main>

        </div>
    `


    document
        .getElementById('logoutButton')
        .addEventListener(
            'click',
            handleLogout
        )


    renderModpacksPage()
}


// ============================================================
// LOGOUT
// ============================================================

async function handleLogout() {

    try {
        await logout()
    } catch (error) {
        console.error(error)
    }

    renderLogin()
}


// ============================================================
// HELPERS
// ============================================================

function getInitial(email) {

    return String(email)
        .charAt(0)
        .toUpperCase()
}


function escapeHTML(value = '') {

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}


// ============================================================
// START
// ============================================================

init()