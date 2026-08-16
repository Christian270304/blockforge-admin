import {
    getModpackVersions,
    createModpackVersion,
    updateModpackVersion,
    deleteModpackVersion
} from './api.js'


let currentModpack = null
let versions = []


// ============================================================
// MODPACK DETAIL
// ============================================================

export function renderModpackDetail(modpack) {

    currentModpack = modpack

    const content =
        document.getElementById('pageContent')

    if (!content) return


    content.innerHTML = `

        <div class="detail-page">

            <!-- BACK -->

            <button
                class="back-button"
                id="backToModpacks"
            >
                ← Volver a modpacks
            </button>


            <!-- HEADER -->

            <div class="modpack-detail-header">

                <div class="detail-pack-icon">
                    ${escapeHTML(
                        modpack.name
                            .substring(0, 2)
                            .toUpperCase()
                    )}
                </div>


                <div class="detail-pack-info">

                    <div class="detail-title-row">

                        <h1>
                            ${escapeHTML(modpack.name)}
                        </h1>

                        <span class="
                            pack-status
                            ${modpack.status === 'published'
                                ? 'published'
                                : 'draft'
                            }
                        ">

                            <span></span>

                            ${modpack.status === 'published'
                                ? 'Publicado'
                                : 'Borrador'
                            }

                        </span>

                    </div>


                    <div class="detail-slug">
                        ${escapeHTML(modpack.slug)}
                    </div>


                    <p>
                        ${escapeHTML(
                            modpack.description ||
                            'Sin descripción'
                        )}
                    </p>

                </div>

            </div>


            <!-- TABS -->

            <div class="detail-tabs">

                <button
                    class="detail-tab active"
                    data-tab="general"
                >
                    General
                </button>

                <button
                    class="detail-tab"
                    data-tab="versions"
                >
                    Versiones
                </button>

                <button
                    class="detail-tab disabled"
                    disabled
                >
                    Noticias
                    <span>PRONTO</span>
                </button>

            </div>


            <!-- CONTENT -->

            <div id="detailContent"></div>

        </div>
    `


    // Volver

    document
        .getElementById('backToModpacks')
        .addEventListener('click', async () => {

            const module =
                await import('./modpacks.js')

            module.renderModpacksPage()
        })


    // Tabs

    document
        .querySelectorAll('.detail-tab[data-tab]')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => selectTab(button)
            )
        })


    renderGeneral()
}


// ============================================================
// TAB NAVIGATION
// ============================================================

function selectTab(button) {

    document
        .querySelectorAll('.detail-tab')
        .forEach(tab =>
            tab.classList.remove('active')
        )


    button.classList.add('active')


    const tab =
        button.dataset.tab


    if (tab === 'general') {
        renderGeneral()
    }


    if (tab === 'versions') {
        renderVersions()
    }
}


// ============================================================
// GENERAL
// ============================================================

function renderGeneral() {

    const container =
        document.getElementById('detailContent')


    container.innerHTML = `

        <div class="detail-section">

            <div class="section-heading">

                <div>
                    <h2>Información general</h2>

                    <p>
                        Configuración principal del modpack.
                    </p>
                </div>

            </div>


            <div class="info-panel">

                ${infoItem(
                    'Minecraft',
                    currentModpack.minecraft_version
                )}

                ${infoItem(
                    'Loader',
                    `${currentModpack.loader}
                     ${currentModpack.loader_version}`
                )}

                ${infoItem(
                    'Servidor',
                    currentModpack.server_address ||
                    'Sin servidor'
                )}

                ${infoItem(
                    'Estado',
                    currentModpack.status === 'published'
                        ? 'Publicado'
                        : 'Borrador'
                )}

            </div>

        </div>
    `
}


// ============================================================
// VERSIONS
// ============================================================

async function renderVersions() {

    const container =
        document.getElementById('detailContent')


    container.innerHTML = `

        <div class="detail-section">

            <div class="section-heading">

                <div>
                    <h2>Versiones</h2>

                    <p>
                        Gestiona las versiones publicadas
                        de ${escapeHTML(currentModpack.name)}.
                    </p>
                </div>


                <button
                    class="primary-button"
                    id="newVersionButton"
                >
                    ＋ Nueva versión
                </button>

            </div>


            <div
                id="versionsList"
                class="versions-list"
            >

                <div class="loading-card">
                    Cargando versiones...
                </div>

            </div>

        </div>
    `


    document
        .getElementById('newVersionButton')
        .addEventListener(
            'click',
            () => openVersionModal()
        )


    await loadVersions()
}


// ============================================================
// LOAD VERSIONS
// ============================================================

async function loadVersions() {

    const list =
        document.getElementById('versionsList')


    try {

        const result =
            await getModpackVersions(
                currentModpack.id
            )


        versions =
            result.versions || []


        drawVersions()


    } catch (error) {

        console.error(error)


        list.innerHTML = `

            <div class="empty-state">

                <strong>
                    No se pudieron cargar las versiones
                </strong>

                <span>
                    ${escapeHTML(error.message)}
                </span>

            </div>
        `
    }
}


// ============================================================
// DRAW VERSIONS
// ============================================================

function drawVersions() {

    const list =
        document.getElementById('versionsList')


    if (versions.length === 0) {

        list.innerHTML = `

            <div class="empty-state version-empty">

                <div class="empty-icon">
                    ◇
                </div>

                <strong>
                    Este modpack todavía no tiene versiones
                </strong>

                <span>
                    Crea la primera versión para comenzar
                    a añadir mods y archivos.
                </span>

                <button
                    class="secondary-button"
                    id="emptyVersionButton"
                >
                    Crear primera versión
                </button>

            </div>
        `


        document
            .getElementById('emptyVersionButton')
            .addEventListener(
                'click',
                () => openVersionModal()
            )


        return
    }


    list.innerHTML =
        versions
            .map(versionCard)
            .join('')


    list
        .querySelectorAll('[data-edit-version]')
        .forEach(button => {

            button.addEventListener(
                'click',
                event => {

                    event.stopPropagation()

                    const id =
                        Number(
                            button.dataset.editVersion
                        )


                    const version =
                        versions.find(
                            item => item.id === id
                        )


                    if (version) {
                        openVersionModal(version)
                    }
                }
            )
        })


    list
        .querySelectorAll('[data-delete-version]')
        .forEach(button => {

            button.addEventListener(
                'click',
                event => {

                    event.stopPropagation()

                    const id =
                        Number(
                            button.dataset.deleteVersion
                        )


                    const version =
                        versions.find(
                            item => item.id === id
                        )


                    if (version) {
                        confirmDeleteVersion(version)
                    }
                }
            )
        })


    // Preparado para el siguiente paso:
    // entrar dentro de una versión.

    list
        .querySelectorAll('[data-version]')
        .forEach(card => {

            card.addEventListener(
                'click',
                () => {

                    const id =
                        Number(card.dataset.version)


                    const version =
                        versions.find(
                            item => item.id === id
                        )


                    if (version) {

                        console.log(
                            'Abrir versión:',
                            version
                        )

                    }
                }
            )
        })
}


function versionCard(version) {

    const published =
        version.status === 'published'


    return `

        <article
            class="version-card"
            data-version="${version.id}"
        >

            <div class="version-main">

                <div class="version-symbol">
                    V
                </div>


                <div class="version-info">

                    <div class="version-title">

                        <h3>
                            ${escapeHTML(version.version)}
                        </h3>


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

                    </div>


                    <div class="version-platform">

                        <span>
                            Minecraft
                            <strong>
                                ${escapeHTML(
                                    version.minecraft_version
                                )}
                            </strong>
                        </span>

                        <span class="platform-dot">
                            ·
                        </span>

                        <span>
                            ${escapeHTML(
                                capitalize(version.loader)
                            )}

                            <strong>
                                ${escapeHTML(
                                    version.loader_version
                                )}
                            </strong>
                        </span>

                    </div>


                    ${
                        version.changelog
                            ? `
                                <p class="version-changelog">
                                    ${escapeHTML(
                                        version.changelog
                                    )}
                                </p>
                              `
                            : ''
                    }

                </div>

            </div>


            <div class="version-actions">

                <button
                    class="version-action"
                    data-edit-version="${version.id}"
                >
                    Editar
                </button>


                <button
                    class="version-action danger"
                    data-delete-version="${version.id}"
                >
                    Eliminar
                </button>


                <span class="version-open">
                    →
                </span>

            </div>

        </article>
    `
}


// ============================================================
// VERSION MODAL
// ============================================================

function openVersionModal(version = null) {

    const overlay =
        document.getElementById('modalOverlay')


    const editing =
        Boolean(version)


    overlay.innerHTML = `

        <div class="modal">

            <div class="modal-header">

                <div>

                    <div class="page-eyebrow">
                        ${editing
                            ? 'EDITAR VERSIÓN'
                            : 'NUEVA VERSIÓN'
                        }
                    </div>

                    <h2>
                        ${editing
                            ? version.version
                            : 'Crear versión'
                        }
                    </h2>

                </div>


                <button
                    class="modal-close"
                    id="versionModalClose"
                    type="button"
                >
                    ×
                </button>

            </div>


            <form id="versionForm">

                <div class="form-grid">


                    <div class="form-group">

                        <label>
                            Versión del modpack *
                        </label>

                        <input
                            id="versionNumber"
                            value="${attribute(
                                version?.version
                            )}"
                            placeholder="1.0.0"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Estado
                        </label>

                        <select id="versionStatus">

                            <option
                                value="draft"
                                ${version?.status !== 'published'
                                    ? 'selected'
                                    : ''
                                }
                            >
                                Borrador
                            </option>

                            <option
                                value="published"
                                ${version?.status === 'published'
                                    ? 'selected'
                                    : ''
                                }
                            >
                                Publicada
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Minecraft *
                        </label>

                        <input
                            id="versionMinecraft"
                            value="${attribute(
                                version?.minecraft_version ||
                                currentModpack.minecraft_version
                            )}"
                            placeholder="1.20.1"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Loader *
                        </label>

                        <select id="versionLoader">

                            ${loaderOption(
                                'forge',
                                'Forge',
                                version?.loader ||
                                currentModpack.loader
                            )}

                            ${loaderOption(
                                'neoforge',
                                'NeoForge',
                                version?.loader ||
                                currentModpack.loader
                            )}

                            ${loaderOption(
                                'fabric',
                                'Fabric',
                                version?.loader ||
                                currentModpack.loader
                            )}

                            ${loaderOption(
                                'quilt',
                                'Quilt',
                                version?.loader ||
                                currentModpack.loader
                            )}

                        </select>

                    </div>


                    <div class="form-group full">

                        <label>
                            Versión del loader *
                        </label>

                        <input
                            id="versionLoaderVersion"
                            value="${attribute(
                                version?.loader_version ||
                                currentModpack.loader_version
                            )}"
                            placeholder="47.4.20"
                            required
                        >

                    </div>


                    <div class="form-group full">

                        <label>
                            Changelog
                        </label>

                        <textarea
                            id="versionChangelog"
                            placeholder="Describe los cambios de esta versión..."
                        >${escapeHTML(
                            version?.changelog || ''
                        )}</textarea>

                    </div>

                </div>


                <div
                    id="versionFormError"
                    class="form-error"
                ></div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        id="cancelVersionModal"
                    >
                        Cancelar
                    </button>


                    <button
                        type="submit"
                        class="primary-button"
                    >
                        ${editing
                            ? 'Guardar cambios'
                            : 'Crear versión'
                        }
                    </button>

                </div>

            </form>

        </div>
    `


    overlay.classList.add('open')


    const close = () => {

        overlay.classList.remove('open')
        overlay.innerHTML = ''

    }


    document
        .getElementById('versionModalClose')
        .addEventListener(
            'click',
            close
        )


    document
        .getElementById('cancelVersionModal')
        .addEventListener(
            'click',
            close
        )


    overlay.addEventListener(
        'click',
        event => {

            if (event.target === overlay) {
                close()
            }

        }
    )


    document
        .getElementById('versionForm')
        .addEventListener(
            'submit',
            async event => {

                event.preventDefault()

                await saveVersion(
                    version,
                    close,
                    event.currentTarget
                )
            }
        )
}


// ============================================================
// SAVE VERSION
// ============================================================

async function saveVersion(
    existing,
    close,
    form
) {

    const error =
        document.getElementById(
            'versionFormError'
        )


    const button =
        form.querySelector(
            'button[type="submit"]'
        )


    const data = {

        version:
            document
                .getElementById('versionNumber')
                .value
                .trim(),

        minecraftVersion:
            document
                .getElementById('versionMinecraft')
                .value
                .trim(),

        loader:
            document
                .getElementById('versionLoader')
                .value,

        loaderVersion:
            document
                .getElementById('versionLoaderVersion')
                .value
                .trim(),

        status:
            document
                .getElementById('versionStatus')
                .value,

        changelog:
            document
                .getElementById('versionChangelog')
                .value
                .trim()
    }


    error.textContent = ''

    button.disabled = true
    button.textContent = 'Guardando...'


    try {

        if (existing) {

            await updateModpackVersion(
                currentModpack.id,
                existing.id,
                data
            )

        } else {

            await createModpackVersion(
                currentModpack.id,
                data
            )

        }


        close()

        await loadVersions()


    } catch (err) {

        error.textContent =
            err.message


        button.disabled = false

        button.textContent =
            existing
                ? 'Guardar cambios'
                : 'Crear versión'
    }
}


// ============================================================
// DELETE VERSION
// ============================================================

function confirmDeleteVersion(version) {

    const overlay =
        document.getElementById('modalOverlay')


    overlay.innerHTML = `

        <div class="modal confirm-modal">

            <div class="danger-symbol">
                !
            </div>


            <h2>
                Eliminar versión
            </h2>


            <p>
                Vas a eliminar la versión

                <strong>
                    ${escapeHTML(version.version)}
                </strong>

                de

                <strong>
                    ${escapeHTML(currentModpack.name)}
                </strong>.

                <br><br>

                Cuando añadamos mods y archivos,
                también se eliminará todo el contenido
                asociado a esta versión.
            </p>


            <div class="modal-actions">

                <button
                    class="secondary-button"
                    id="cancelVersionDelete"
                >
                    Cancelar
                </button>


                <button
                    class="danger-button"
                    id="confirmVersionDelete"
                >
                    Eliminar versión
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
        .getElementById('cancelVersionDelete')
        .addEventListener(
            'click',
            close
        )


    document
        .getElementById('confirmVersionDelete')
        .addEventListener(
            'click',
            async () => {

                try {

                    await deleteModpackVersion(
                        currentModpack.id,
                        version.id
                    )


                    close()

                    await loadVersions()


                } catch (error) {

                    console.error(error)

                }
            }
        )
}


// ============================================================
// HELPERS
// ============================================================

function infoItem(label, value) {

    return `

        <div class="info-item">

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${escapeHTML(value || '—')}
            </strong>

        </div>
    `
}


function loaderOption(
    value,
    label,
    selected
) {

    return `

        <option
            value="${value}"
            ${selected === value
                ? 'selected'
                : ''
            }
        >
            ${label}
        </option>
    `
}


function capitalize(value = '') {

    if (!value) return ''

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    )
}


function attribute(value = '') {
    return escapeHTML(value)
}


function escapeHTML(value = '') {

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}