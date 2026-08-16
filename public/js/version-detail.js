import {
    getMods,
    deleteMod,
    createMod,
    searchModrinth,
    getModrinthVersions,
    uploadModFile
} from './api.js'


let currentModpack = null
let currentVersion = null
let mods = []
let currentSearch = ''


// ============================================================
// RENDER VERSION DETAIL
// ============================================================

export function renderVersionDetail(modpack, version) {

    currentModpack = modpack
    currentVersion = version

    const content =
        document.getElementById('pageContent')

    if (!content) return


    content.innerHTML = `

        <div class="version-detail-page">

            <!-- BREADCRUMB -->

            <div class="version-breadcrumb">

                <button id="backToModpack">
                    ${escapeHTML(modpack.name)}
                </button>

                <span>/</span>

                <strong>
                    ${escapeHTML(version.version)}
                </strong>

            </div>


            <!-- HEADER -->

            <div class="version-detail-header">

                <div>

                    <div class="page-eyebrow">
                        VERSIÓN DEL MODPACK
                    </div>

                    <div class="version-detail-title-row">

                        <h1>
                            ${escapeHTML(modpack.name)}
                            <span>
                                ${escapeHTML(version.version)}
                            </span>
                        </h1>

                        ${renderStatus(version.status)}

                    </div>


                    <div class="version-environment">

                        <span>
                            Minecraft
                            <strong>
                                ${escapeHTML(
                                    version.minecraft_version
                                )}
                            </strong>
                        </span>

                        <i></i>

                        <span>
                            ${escapeHTML(
                                formatLoader(version.loader)
                            )}

                            <strong>
                                ${escapeHTML(
                                    version.loader_version
                                )}
                            </strong>
                        </span>

                    </div>

                </div>

            </div>


            <!-- TABS -->

            <div class="version-tabs">

                <button
                    class="version-tab active"
                    data-version-tab="summary"
                >
                    Resumen
                </button>

                <button
                    class="version-tab"
                    data-version-tab="mods"
                >
                    Mods
                </button>

                <button
                    class="version-tab"
                    data-version-tab="files"
                >
                    Archivos
                </button>

            </div>


            <!-- TAB CONTENT -->

            <div id="versionTabContent"></div>

        </div>
    `


    // Volver al modpack

    document
        .getElementById('backToModpack')
        .addEventListener('click', async () => {

            const module =
                await import('./versions.js')

            module.renderModpackDetail(
                currentModpack
            )
        })


    // Navegación

    document
        .querySelectorAll(
            '[data-version-tab]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => selectVersionTab(button)
            )

        })


    renderSummary()
}


// ============================================================
// TAB NAVIGATION
// ============================================================

function selectVersionTab(button) {

    document
        .querySelectorAll('.version-tab')
        .forEach(tab =>
            tab.classList.remove('active')
        )


    button.classList.add('active')


    switch (button.dataset.versionTab) {

        case 'summary':
            renderSummary()
            break

        case 'mods':
            renderModsPage()
            break

        case 'files':
            renderFiles()
            break
    }
}


// ============================================================
// SUMMARY
// ============================================================

function renderSummary() {

    const container =
        document.getElementById(
            'versionTabContent'
        )


    container.innerHTML = `

        <div class="version-section">

            <div class="section-heading">

                <div>
                    <h2>Resumen</h2>

                    <p>
                        Información y contenido de esta versión.
                    </p>
                </div>

            </div>


            <div class="version-summary-grid">

                <div class="summary-card">

                    <span>MINECRAFT</span>

                    <strong>
                        ${escapeHTML(
                            currentVersion.minecraft_version
                        )}
                    </strong>

                    <small>
                        Versión del juego
                    </small>

                </div>


                <div class="summary-card">

                    <span>MOD LOADER</span>

                    <strong>
                        ${escapeHTML(
                            formatLoader(
                                currentVersion.loader
                            )
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            currentVersion.loader_version
                        )}
                    </small>

                </div>


                <div class="summary-card">

                    <span>ESTADO</span>

                    <strong>
                        ${
                            currentVersion.status === 'published'
                                ? 'Publicada'
                                : 'Borrador'
                        }
                    </strong>

                    <small>
                        Estado de distribución
                    </small>

                </div>

            </div>


            ${
                currentVersion.changelog
                    ? `
                        <div class="version-changelog-panel">

                            <span>CHANGELOG</span>

                            <p>
                                ${escapeHTML(
                                    currentVersion.changelog
                                )}
                            </p>

                        </div>
                      `
                    : ''
            }

        </div>
    `
}


// ============================================================
// MODS PAGE
// ============================================================

async function renderModsPage() {

    const container =
        document.getElementById(
            'versionTabContent'
        )


    container.innerHTML = `

        <div class="version-section">

            <div class="section-heading">

                <div>

                    <h2>
                        Mods
                    </h2>

                    <p>
                        Mods incluidos en esta versión.
                    </p>

                </div>


                <button
                    class="primary-button"
                    id="addModButton"
                >
                    ＋ Añadir mod
                </button>

            </div>


            <div class="mods-toolbar">

                <div class="mods-search">

                    <span>⌕</span>

                    <input
                        id="installedModsSearch"
                        type="text"
                        placeholder="Buscar entre los mods instalados..."
                    >

                </div>


                <div
                    class="mods-total"
                    id="modsTotal"
                >
                    0 mods
                </div>

            </div>


            <div
                class="version-mods-list"
                id="versionModsList"
            >

                <div class="loading-card">
                    Cargando mods...
                </div>

            </div>

        </div>
    `


    // Buscar instalados

    document
        .getElementById('installedModsSearch')
        .addEventListener('input', event => {

            currentSearch =
                event.target.value

            drawMods()
        })


    // Este botón lo conectaremos con
    // Modrinth en el siguiente paso.

    document
        .getElementById('addModButton')
        .addEventListener('click', () => {

            openAddModPlaceholder()

        })


    await loadMods()
}


// ============================================================
// LOAD MODS
// ============================================================

async function loadMods() {

    const list =
        document.getElementById(
            'versionModsList'
        )


    try {

        const result =
            await getMods(
                currentModpack.id,
                currentVersion.id
            )


        mods =
            result.mods || []


        drawMods()


    } catch (error) {

        console.error(error)


        list.innerHTML = `

            <div class="empty-state">

                <strong>
                    No se pudieron cargar los mods
                </strong>

                <span>
                    ${escapeHTML(error.message)}
                </span>

            </div>
        `
    }
}


// ============================================================
// DRAW MODS
// ============================================================

function drawMods() {

    const list =
        document.getElementById(
            'versionModsList'
        )

    const total =
        document.getElementById(
            'modsTotal'
        )


    if (!list) return


    const search =
        currentSearch
            .trim()
            .toLowerCase()


    const filtered =
        mods.filter(mod => {

            if (!search) return true


            return (
                mod.name
                    .toLowerCase()
                    .includes(search)
                ||
                mod.filename
                    .toLowerCase()
                    .includes(search)
            )

        })


    if (total) {

        total.textContent =
            `${mods.length} ${
                mods.length === 1
                    ? 'mod'
                    : 'mods'
            }`
    }


    // No hay mods

    if (mods.length === 0) {

        list.innerHTML = `

            <div class="empty-state mods-empty">

                <div class="empty-icon">
                    ◇
                </div>

                <strong>
                    Todavía no hay mods
                </strong>

                <span>
                    Añade mods desde Modrinth
                    o utiliza un archivo propio.
                </span>

                <button
                    class="secondary-button"
                    id="emptyAddMod"
                >
                    Añadir primer mod
                </button>

            </div>
        `


        document
            .getElementById('emptyAddMod')
            .addEventListener(
                'click',
                openAddModPlaceholder
            )


        return
    }


    // No coincide búsqueda

    if (filtered.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                <strong>
                    No se encontraron mods
                </strong>

                <span>
                    Prueba con otra búsqueda.
                </span>

            </div>
        `

        return
    }


    list.innerHTML =
        filtered
            .map(modCard)
            .join('')


    // DELETE

    list
        .querySelectorAll(
            '[data-delete-mod]'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                event => {

                    event.stopPropagation()


                    const id =
                        Number(
                            button.dataset.deleteMod
                        )


                    const mod =
                        mods.find(
                            item =>
                                item.id === id
                        )


                    if (mod) {
                        confirmDeleteMod(mod)
                    }

                }
            )
        })
}


// ============================================================
// MOD CARD
// ============================================================

function modCard(mod) {

    return `

        <article class="installed-mod">

            <div class="installed-mod-main">

                <div class="
                    installed-mod-icon
                    source-${escapeHTML(mod.source)}
                ">
                    ${sourceIcon(mod.source)}
                </div>


                <div class="installed-mod-info">

                    <div class="installed-mod-name">

                        ${escapeHTML(mod.name)}

                        ${
                            mod.required
                                ? `
                                    <span class="required-badge">
                                        OBLIGATORIO
                                    </span>
                                  `
                                : ''
                        }

                    </div>


                    <div class="installed-mod-file">
                        ${escapeHTML(mod.filename)}
                    </div>

                </div>

            </div>


            <div class="installed-mod-meta">

                <div class="
                    mod-source
                    source-${escapeHTML(mod.source)}
                ">
                    ${sourceLabel(mod.source)}
                </div>


                ${
                    mod.sha256
                        ? `
                            <div
                                class="hash-indicator"
                                title="SHA-256 disponible"
                            >
                                ✓
                            </div>
                          `
                        : ''
                }


                <button
                    class="icon-action danger"
                    data-delete-mod="${mod.id}"
                    title="Eliminar"
                >
                    ×
                </button>

            </div>

        </article>
    `
}


// ============================================================
// DELETE MOD
// ============================================================

function confirmDeleteMod(mod) {

    const overlay =
        document.getElementById(
            'modalOverlay'
        )


    overlay.innerHTML = `

        <div class="modal confirm-modal">

            <div class="danger-symbol">
                !
            </div>


            <h2>
                Eliminar mod
            </h2>


            <p>

                ¿Quieres eliminar

                <strong>
                    ${escapeHTML(mod.name)}
                </strong>

                de la versión

                <strong>
                    ${escapeHTML(
                        currentVersion.version
                    )}
                </strong>?

            </p>


            <div class="modal-actions">

                <button
                    class="secondary-button"
                    id="cancelDeleteMod"
                >
                    Cancelar
                </button>


                <button
                    class="danger-button"
                    id="confirmDeleteMod"
                >
                    Eliminar
                </button>

            </div>

        </div>
    `


    overlay.classList.add('open')


    const close = () => {

        overlay.classList.remove('open')
        overlay.innerHTML = ''

    }


    document
        .getElementById('cancelDeleteMod')
        .addEventListener(
            'click',
            close
        )


    document
        .getElementById('confirmDeleteMod')
        .addEventListener(
            'click',
            async () => {

                try {

                    await deleteMod(
                        currentModpack.id,
                        currentVersion.id,
                        mod.id
                    )


                    close()

                    await loadMods()


                } catch (error) {

                    console.error(error)

                }

            }
        )
}


// ============================================================
// TEMPORARY ADD MOD MODAL
// ============================================================

function openAddModPlaceholder() {

    const overlay =
        document.getElementById('modalOverlay')

    overlay.innerHTML = `

        <div class="modal add-mod-modal">

            <div class="modal-header">

                <div>
                    <div class="page-eyebrow">
                        MODS
                    </div>

                    <h2>Añadir mod</h2>

                    <p class="modal-subtitle">
                        ${escapeHTML(currentVersion.minecraft_version)}
                        ·
                        ${escapeHTML(formatLoader(currentVersion.loader))}
                    </p>
                </div>

                <button
                    class="modal-close"
                    id="closeAddMod"
                >
                    ×
                </button>

            </div>


            <div class="add-mod-tabs">

                <button
                    class="add-mod-tab active"
                    data-source="modrinth"
                >
                    Modrinth
                </button>

                <button
                    class="add-mod-tab"
                    data-source="storage"
                >
                    Archivo propio
                </button>

                <button
                    class="add-mod-tab"
                    data-source="url"
                >
                    URL
                </button>

            </div>


            <div id="addModContent"></div>

        </div>
    `

    overlay.classList.add('open')


    // CERRAR

    const close = () => {

        overlay.classList.remove('open')
        overlay.innerHTML = ''

    }


    document
        .getElementById('closeAddMod')
        .addEventListener('click', close)


    overlay.addEventListener(
        'click',
        event => {

            if (event.target === overlay) {
                close()
            }

        }
    )


    // TABS

    document
        .querySelectorAll('.add-mod-tab')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    document
                        .querySelectorAll('.add-mod-tab')
                        .forEach(tab =>
                            tab.classList.remove('active')
                        )

                    button.classList.add('active')


                    switch (button.dataset.source) {

                        case 'modrinth':
                            renderModrinthSearch()
                            break

                        case 'storage':
                            renderStoragePlaceholder()
                            break

                        case 'url':
                            renderUrlPlaceholder()
                            break
                    }

                }
            )

        })


    renderModrinthSearch()
}

function renderModrinthSearch() {

    const content =
        document.getElementById('addModContent')

    if (!content) return


    content.innerHTML = `

        <div class="modrinth-search-view">

            <div class="modrinth-search-header">

                <label>
                    Buscar en Modrinth
                </label>

                <div class="modrinth-search-box">

                    <span>⌕</span>

                    <input
                        id="modrinthSearchInput"
                        type="text"
                        placeholder="Create, JEI, Alex's Mobs..."
                        autocomplete="off"
                    >

                    <button
                        id="modrinthSearchButton"
                        class="primary-button"
                    >
                        Buscar
                    </button>

                </div>

            </div>


            <div
                id="modrinthResults"
                class="modrinth-results"
            >

                <div class="modrinth-welcome">

                    <div class="modrinth-logo">
                        M
                    </div>

                    <strong>
                        Buscar mods
                    </strong>

                    <span>
                        Los resultados se obtienen directamente
                        desde Modrinth.
                    </span>

                </div>

            </div>

        </div>
    `


    const input =
        document.getElementById(
            'modrinthSearchInput'
        )

    const button =
        document.getElementById(
            'modrinthSearchButton'
        )


    const search = () => {

        const query =
            input.value.trim()

        if (!query) return

        performModrinthSearch(query)

    }


    button.addEventListener(
        'click',
        search
    )


    input.addEventListener(
        'keydown',
        event => {

            if (event.key === 'Enter') {
                search()
            }

        }
    )


    input.focus()
}

async function performModrinthSearch(query) {

    const results =
        document.getElementById(
            'modrinthResults'
        )

    if (!results) return


    results.innerHTML = `

        <div class="modrinth-loading">

            <div class="spinner"></div>

            <span>
                Buscando "${escapeHTML(query)}"...
            </span>

        </div>
    `


    try {

        const response =
            await searchModrinth(query)


        const projects =
            response.projects || []


        if (projects.length === 0) {

            results.innerHTML = `

                <div class="modrinth-welcome">

                    <strong>
                        Sin resultados
                    </strong>

                    <span>
                        No encontramos mods para
                        "${escapeHTML(query)}".
                    </span>

                </div>
            `

            return
        }


        results.innerHTML =
            projects
                .map(renderModrinthProject)
                .join('')


        results
            .querySelectorAll(
                '[data-modrinth-project]'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        const projectId =
                            button.dataset.modrinthProject


                        const project =
                            projects.find(
                                item =>
                                    item.projectId === projectId
                            )


                        if (project) {
                            openModrinthProject(project)
                        }

                    }
                )

            })


    } catch (error) {

        console.error(error)


        results.innerHTML = `

            <div class="modrinth-error">

                <strong>
                    No se pudo consultar Modrinth
                </strong>

                <span>
                    ${escapeHTML(error.message)}
                </span>

            </div>
        `
    }
}

function renderModrinthProject(project) {

    return `

        <button
            class="modrinth-project"
            data-modrinth-project="${escapeHTML(
                project.projectId
            )}"
        >

            <div class="modrinth-project-icon">

                ${
                    project.iconUrl

                        ? `
                            <img
                                src="${escapeHTML(
                                    project.iconUrl
                                )}"
                                alt=""
                            >
                          `

                        : `
                            <span>M</span>
                          `
                }

            </div>


            <div class="modrinth-project-info">

                <div class="modrinth-project-title">

                    ${escapeHTML(project.title)}

                </div>


                <div class="modrinth-project-description">

                    ${escapeHTML(
                        project.description || ''
                    )}

                </div>


                <div class="modrinth-project-meta">

                    <span>
                        ${escapeHTML(
                            project.author || 'Desconocido'
                        )}
                    </span>

                    <i></i>

                    <span>
                        ${formatDownloads(
                            project.downloads
                        )} descargas
                    </span>

                </div>

            </div>


            <div class="modrinth-project-arrow">
                →
            </div>

        </button>
    `
}

function formatDownloads(value = 0) {

    const number =
        Number(value) || 0


    if (number >= 1_000_000) {

        return (
            number / 1_000_000
        ).toFixed(1) + 'M'
    }


    if (number >= 1_000) {

        return (
            number / 1_000
        ).toFixed(1) + 'K'
    }


    return String(number)
}

async function openModrinthProject(project) {

    const content =
        document.getElementById(
            'addModContent'
        )

    if (!content) return


    content.innerHTML = `

        <div class="selected-mod-loading">

            <div class="spinner"></div>

            <span>
                Buscando versiones compatibles...
            </span>

        </div>
    `


    try {

        const response =
            await getModrinthVersions(

                project.projectId,

                currentVersion.minecraft_version,

                currentVersion.loader
            )


        const versions =
            response.versions || []


        renderModrinthVersions(
            project,
            versions
        )


    } catch (error) {

        console.error(error)


        content.innerHTML = `

            <div class="modrinth-error">

                <strong>
                    No se pudieron cargar las versiones
                </strong>

                <span>
                    ${escapeHTML(error.message)}
                </span>

                <button
                    class="secondary-button"
                    id="backModrinthSearch"
                >
                    ← Volver
                </button>

            </div>
        `


        document
            .getElementById('backModrinthSearch')
            .addEventListener(
                'click',
                renderModrinthSearch
            )

    }
}

function renderModrinthVersions(
    project,
    versions
) {

    const content =
        document.getElementById(
            'addModContent'
        )


    if (versions.length === 0) {

        content.innerHTML = `

            <div class="modrinth-error">

                <strong>
                    No hay versiones compatibles
                </strong>

                <span>
                    ${escapeHTML(project.title)}
                    no tiene una versión para

                    ${escapeHTML(
                        currentVersion.minecraft_version
                    )}

                    +

                    ${escapeHTML(
                        formatLoader(
                            currentVersion.loader
                        )
                    )}.
                </span>

                <button
                    class="secondary-button"
                    id="backModrinthSearch"
                >
                    ← Volver
                </button>

            </div>
        `


        document
            .getElementById('backModrinthSearch')
            .addEventListener(
                'click',
                renderModrinthSearch
            )


        return
    }


    const firstVersion =
        versions[0]


    content.innerHTML = `

        <div class="modrinth-version-view">

            <button
                class="back-link"
                id="backModrinthSearch"
            >
                ← Volver a resultados
            </button>


            <div class="selected-project">

                <div class="selected-project-icon">

                    ${
                        project.iconUrl

                            ? `
                                <img
                                    src="${escapeHTML(
                                        project.iconUrl
                                    )}"
                                    alt=""
                                >
                              `

                            : 'M'
                    }

                </div>


                <div>

                    <h3>
                        ${escapeHTML(project.title)}
                    </h3>

                    <p>
                        por
                        ${escapeHTML(
                            project.author || 'Desconocido'
                        )}
                    </p>

                </div>

            </div>


            <div class="compatibility-panel">

                <div class="compatibility-item">

                    <span>✓</span>

                    Minecraft

                    <strong>
                        ${escapeHTML(
                            currentVersion.minecraft_version
                        )}
                    </strong>

                </div>


                <div class="compatibility-item">

                    <span>✓</span>

                    Loader

                    <strong>
                        ${escapeHTML(
                            formatLoader(
                                currentVersion.loader
                            )
                        )}
                    </strong>

                </div>

            </div>


            <div class="version-selector-group">

                <label>
                    Versión
                </label>

                <select id="modrinthVersionSelect">

                    ${versions
                        .map(version => `

                            <option
                                value="${escapeHTML(
                                    version.versionId
                                )}"
                            >
                                ${escapeHTML(
                                    version.versionNumber
                                )}
                                —
                                ${formatVersionType(
                                    version.versionType
                                )}
                            </option>

                        `)
                        .join('')}

                </select>

            </div>


            <div
                class="selected-version-info"
                id="selectedVersionInfo"
            ></div>


            <label class="required-option">

                <input
                    type="checkbox"
                    id="requiredModCheckbox"
                    checked
                >

                <div>

                    <strong>
                        Mod obligatorio
                    </strong>

                    <span>
                        El launcher instalará siempre
                        este mod.
                    </span>

                </div>

            </label>


            <div class="modal-actions">

                <button
                    class="secondary-button"
                    id="cancelModrinthAdd"
                >
                    Cancelar
                </button>


                <button
                    class="primary-button"
                    id="confirmModrinthAdd"
                >
                    Añadir al modpack
                </button>

            </div>

        </div>
    `


    const select =
        document.getElementById(
            'modrinthVersionSelect'
        )


    const drawSelectedVersion = () => {

        const version =
            versions.find(
                item =>
                    item.versionId ===
                    select.value
            )


        renderSelectedVersionInfo(
            version
        )

    }


    select.addEventListener(
        'change',
        drawSelectedVersion
    )


    document
        .getElementById('backModrinthSearch')
        .addEventListener(
            'click',
            renderModrinthSearch
        )


    document
        .getElementById('cancelModrinthAdd')
        .addEventListener(
            'click',
            closeAddModModal
        )


    document
        .getElementById('confirmModrinthAdd')
        .addEventListener(
            'click',
            () => {

                const version =
                    versions.find(
                        item =>
                            item.versionId ===
                            select.value
                    )


                installModrinthMod(
                    project,
                    version
                )

            }
        )


    renderSelectedVersionInfo(
        firstVersion
    )
}


function formatVersionType(type) {

    switch (type) {

        case 'release':
            return 'Release'

        case 'beta':
            return 'Beta'

        case 'alpha':
            return 'Alpha'

        default:
            return type
    }
}


function formatBytes(bytes = 0) {

    const value =
        Number(bytes) || 0


    if (value >= 1024 * 1024) {

        return (
            value /
            1024 /
            1024
        ).toFixed(1) + ' MB'
    }


    if (value >= 1024) {

        return (
            value /
            1024
        ).toFixed(1) + ' KB'
    }


    return `${value} B`
}


function renderSelectedVersionInfo(version) {

    const container =
        document.getElementById(
            'selectedVersionInfo'
        )


    if (!container || !version) return


    container.innerHTML = `

        <div class="version-file">

            <div>

                <span>
                    ARCHIVO
                </span>

                <strong>
                    ${escapeHTML(
                        version.filename || 'Sin archivo'
                    )}
                </strong>

            </div>


            <div class="version-file-size">

                ${formatBytes(
                    version.size
                )}

            </div>

        </div>


        <div class="version-extra-info">

            <span>
                ${formatVersionType(
                    version.versionType
                )}
            </span>

            <span>
                ${formatDate(
                    version.published
                )}
            </span>

            ${
                version.sha256

                    ? `
                        <span>
                            ✓ SHA-256
                        </span>
                      `

                    : ''
            }

        </div>
    `
}


function formatDate(value) {

    if (!value) return ''


    const date =
        new Date(value)


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return ''
    }


    return date.toLocaleDateString(
        'es-ES',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    )
}


async function installModrinthMod(
    project,
    version
) {

    if (!version) return


    const button =
        document.getElementById(
            'confirmModrinthAdd'
        )


    const required =
        document
            .getElementById(
                'requiredModCheckbox'
            )
            ?.checked ?? true


    try {

        button.disabled = true
        button.textContent = 'Añadiendo...'


        await createMod(
            currentModpack.id,
            currentVersion.id,
            {
                name:
                    project.title,

                filename:
                    version.filename,

                source:
                    'modrinth',

                projectId:
                    project.projectId,

                versionId:
                    version.versionId,

                downloadUrl:
                    version.downloadUrl,

                required,

                sha256:
                    version.sha256
            }
        )


        closeAddModModal()


        await loadMods()


    } catch (error) {

        console.error(error)

        button.disabled = false
        button.textContent =
            'Añadir al modpack'

        alert(
            'No se pudo añadir el mod: ' +
            error.message
        )
    }
}


function closeAddModModal() {

    const overlay =
        document.getElementById(
            'modalOverlay'
        )


    if (!overlay) return


    overlay.classList.remove('open')
    overlay.innerHTML = ''
}



function renderStoragePlaceholder() {

    const content =
        document.getElementById(
            'addModContent'
        )

    if (!content) return


    content.innerHTML = `

        <div class="storage-upload-view">

            <div class="storage-upload-header">

                <h3>
                    Archivo propio
                </h3>

                <p>
                    Sube un mod que no esté disponible
                    en Modrinth.
                </p>

            </div>


            <label
                class="jar-dropzone"
                id="jarDropzone"
            >

                <input
                    type="file"
                    id="jarFileInput"
                    accept=".jar"
                    hidden
                >

                <div class="jar-drop-icon">
                    ↑
                </div>

                <strong>
                    Arrastra un archivo .jar
                </strong>

                <span>
                    o haz clic para seleccionarlo
                </span>

            </label>


            <div
                class="selected-jar"
                id="selectedJar"
                hidden
            ></div>


            <div class="storage-form">

                <label>
                    Nombre del mod

                    <input
                        type="text"
                        id="storageModName"
                        placeholder="Ej. FailZone Shop"
                    >
                </label>


                <label class="required-option">

                    <input
                        type="checkbox"
                        id="storageRequired"
                        checked
                    >

                    <div>

                        <strong>
                            Mod obligatorio
                        </strong>

                        <span>
                            El launcher instalará siempre
                            este archivo.
                        </span>

                    </div>

                </label>

            </div>


            <div class="modal-actions">

                <button
                    class="secondary-button"
                    id="cancelStorageMod"
                >
                    Cancelar
                </button>


                <button
                    class="primary-button"
                    id="uploadStorageMod"
                    disabled
                >
                    Añadir al modpack
                </button>

            </div>

        </div>
    `


    initStorageUpload()
}


function initStorageUpload() {

    const input =
        document.getElementById(
            'jarFileInput'
        )

    const dropzone =
        document.getElementById(
            'jarDropzone'
        )

    const cancel =
        document.getElementById(
            'cancelStorageMod'
        )

    const upload =
        document.getElementById(
            'uploadStorageMod'
        )


    let selectedFile = null


    // ========================================================
    // FILE INPUT
    // ========================================================

    input.addEventListener(
        'change',
        () => {

            const file =
                input.files?.[0]

            if (file) {
                selectJar(file)
            }

        }
    )


    // ========================================================
    // DRAG
    // ========================================================

    dropzone.addEventListener(
        'dragover',
        event => {

            event.preventDefault()

            dropzone.classList.add(
                'dragging'
            )

        }
    )


    dropzone.addEventListener(
        'dragleave',
        () => {

            dropzone.classList.remove(
                'dragging'
            )

        }
    )


    dropzone.addEventListener(
        'drop',
        event => {

            event.preventDefault()

            dropzone.classList.remove(
                'dragging'
            )


            const file =
                event.dataTransfer
                    ?.files?.[0]


            if (file) {
                selectJar(file)
            }

        }
    )


    // ========================================================
    // SELECT
    // ========================================================

    function selectJar(file) {

        if (
            !file.name
                .toLowerCase()
                .endsWith('.jar')
        ) {

            alert(
                'Solo puedes subir archivos .jar'
            )

            return
        }


        selectedFile =
            file


        renderSelectedJar(file)


        const nameInput =
            document.getElementById(
                'storageModName'
            )


        // Nombre automático:
        //
        // failzone-shop-1.2.0.jar
        // ↓
        // failzone shop

        if (!nameInput.value.trim()) {

            nameInput.value =
                guessModName(
                    file.name
                )

        }


        upload.disabled =
            false
    }


    // ========================================================
    // CANCEL
    // ========================================================

    cancel.addEventListener(
        'click',
        closeAddModModal
    )


    // ========================================================
    // UPLOAD
    // ========================================================

    upload.addEventListener(
        'click',
        async () => {

            if (!selectedFile) return


            await saveStorageMod(
                selectedFile
            )

        }
    )
}



function renderSelectedJar(file) {

    const container =
        document.getElementById(
            'selectedJar'
        )


    if (!container) return


    container.hidden =
        false


    container.innerHTML = `

        <div class="selected-jar-icon">
            JAR
        </div>


        <div class="selected-jar-info">

            <strong>
                ${escapeHTML(file.name)}
            </strong>

            <span>
                ${formatBytes(file.size)}
            </span>

        </div>


        <div class="selected-jar-ok">
            ✓
        </div>
    `
}


function guessModName(filename) {

    return filename

        // quitar .jar
        .replace(
            /\.jar$/i,
            ''
        )

        // eliminar versión habitual al final
        .replace(
            /[-_ ]v?\d+(?:\.\d+)+(?:[-+._][a-z0-9.-]+)?$/i,
            ''
        )

        // guiones
        .replace(
            /[-_]+/g,
            ' '
        )

        // espacios
        .replace(
            /\s+/g,
            ' '
        )

        .trim()

        // Capitalizar
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        )
}



async function saveStorageMod(file) {

    const button =
        document.getElementById(
            'uploadStorageMod'
        )

    const nameInput =
        document.getElementById(
            'storageModName'
        )

    const requiredInput =
        document.getElementById(
            'storageRequired'
        )


    const name =
        nameInput.value.trim()


    if (!name) {

        nameInput.focus()

        return
    }


    try {

        button.disabled =
            true

        button.textContent =
            'Subiendo archivo...'


        // ====================================================
        // 1. CLOUDINARY
        // ====================================================

        const upload =
            await uploadModFile(
                currentModpack.id,
                currentVersion.id,
                file
            )


        if (!upload.file) {
            throw new Error(
                'La API no devolvió información del archivo'
            )
        }


        button.textContent =
            'Guardando mod...'


        // ====================================================
        // 2. D1
        // ====================================================

        await createMod(
            currentModpack.id,
            currentVersion.id,
            {

                name,

                // MUY IMPORTANTE:
                // nombre original exacto
                filename:
                    upload.file.filename,

                source:
                    'storage',

                storageProvider:
                    upload.file.storageProvider,

                storageId:
                    upload.file.storageId,

                downloadUrl:
                    upload.file.downloadUrl,

                sha256:
                    upload.file.sha256,

                required:
                    requiredInput.checked
            }
        )


        // ====================================================
        // 3. UI
        // ====================================================

        closeAddModModal()


        await loadMods()


    } catch (error) {

        console.error(
            'Error añadiendo archivo propio:',
            error
        )


        button.disabled =
            false

        button.textContent =
            'Añadir al modpack'


        alert(
            error instanceof Error
                ? error.message
                : 'No se pudo añadir el mod'
        )
    }
}



// ============================================================
// FILES
// ============================================================

function renderFiles() {

    const container =
        document.getElementById(
            'versionTabContent'
        )


    container.innerHTML = `

        <div class="version-section">

            <div class="empty-state">

                <div class="empty-icon">
                    ◫
                </div>

                <strong>
                    Gestión de archivos
                </strong>

                <span>
                    Configs, KubeJS, resourcepacks
                    y demás archivos del modpack.
                </span>

            </div>

        </div>
    `
}


// ============================================================
// HELPERS
// ============================================================

function renderStatus(status) {

    const published =
        status === 'published'


    return `

        <span class="
            pack-status
            ${published
                ? 'published'
                : 'draft'
            }
        ">

            <span></span>

            ${published
                ? 'Publicada'
                : 'Borrador'
            }

        </span>
    `
}


function sourceIcon(source) {

    switch (source) {

        case 'modrinth':
            return 'M'

        case 'storage':
            return 'B'

        case 'url':
            return '↗'

        default:
            return '◇'
    }
}


function sourceLabel(source) {

    switch (source) {

        case 'modrinth':
            return 'MODRINTH'

        case 'storage':
            return 'PROPIO'

        case 'url':
            return 'URL'

        default:
            return source.toUpperCase()
    }
}


function formatLoader(loader = '') {

    switch (loader.toLowerCase()) {

        case 'forge':
            return 'Forge'

        case 'neoforge':
            return 'NeoForge'

        case 'fabric':
            return 'Fabric'

        case 'quilt':
            return 'Quilt'

        default:
            return loader
    }
}


function escapeHTML(value = '') {

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}