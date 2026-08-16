import {
    getModpacks,
    createModpack,
    updateModpack,
    deleteModpack
} from './api.js'

import {
    renderModpackDetail
} from './versions.js'


let modpacks = []


// ============================================================
// PAGE
// ============================================================

export async function renderModpacksPage() {

    const content =
        document.getElementById('pageContent')

    if (!content) return


    content.innerHTML = `

        <div class="page-header">

            <div>
                <div class="page-eyebrow">
                    LIBRARY
                </div>

                <h1>Modpacks</h1>

                <p>
                    Gestiona todos los modpacks disponibles
                    en BlockForge.
                </p>
            </div>


            <button
                class="primary-button"
                id="newModpackButton"
            >
                <span>＋</span>
                Nuevo modpack
            </button>

        </div>


        <div class="summary-bar">

            <div>
                <span class="summary-value" id="modpackCount">
                    —
                </span>

                <span class="summary-label">
                    Modpacks
                </span>
            </div>

            <div>
                <span class="summary-value" id="publishedCount">
                    —
                </span>

                <span class="summary-label">
                    Publicados
                </span>
            </div>

            <div>
                <span class="summary-value" id="draftCount">
                    —
                </span>

                <span class="summary-label">
                    Borradores
                </span>
            </div>

        </div>


        <div
            id="modpackList"
            class="modpack-grid"
        >

            <div class="loading-card">
                Cargando modpacks...
            </div>

        </div>
    `


    document
        .getElementById('newModpackButton')
        .addEventListener(
            'click',
            () => openModpackModal()
        )


    await loadModpacks()
}


// ============================================================
// LOAD
// ============================================================

async function loadModpacks() {

    const list =
        document.getElementById('modpackList')


    try {

        const data =
            await getModpacks()


        modpacks =
            data.modpacks || []


        renderModpacks()


    } catch (error) {

        console.error(error)

        list.innerHTML = `
            <div class="empty-state">
                <strong>Error</strong>

                <span>
                    No se pudieron cargar los modpacks.
                </span>
            </div>
        `
    }
}


// ============================================================
// RENDER
// ============================================================

function renderModpacks() {

    const list =
        document.getElementById('modpackList')


    const published =
        modpacks.filter(
            m => m.status === 'published'
        ).length


    document.getElementById('modpackCount')
        .textContent = modpacks.length


    document.getElementById('publishedCount')
        .textContent = published


    document.getElementById('draftCount')
        .textContent =
            modpacks.length - published


    if (modpacks.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ◫
                </div>

                <strong>
                    Todavía no hay modpacks
                </strong>

                <span>
                    Crea tu primer modpack para empezar.
                </span>

                <button
                    class="secondary-button"
                    id="emptyCreateButton"
                >
                    Crear modpack
                </button>

            </div>
        `


        document
            .getElementById('emptyCreateButton')
            .addEventListener(
                'click',
                () => openModpackModal()
            )

        return
    }


    list.innerHTML =
        modpacks
            .map(modpackCard)
            .join('')


    list
        .querySelectorAll('[data-edit]')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    const id =
                        Number(button.dataset.edit)

                    const modpack =
                        modpacks.find(
                            m => m.id === id
                        )

                    if (modpack) {
                        openModpackModal(modpack)
                    }
                }
            )
        })


    list
        .querySelectorAll('[data-delete]')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    const id =
                        Number(button.dataset.delete)

                    const modpack =
                        modpacks.find(
                            m => m.id === id
                        )

                    if (modpack) {
                        confirmDelete(modpack)
                    }
                }
            )
        })

    list
    .querySelectorAll('[data-open-modpack]')
    .forEach(card => {

        card.addEventListener(
            'click',
            event => {

                if (
                    event.target.closest(
                        '[data-edit], [data-delete]'
                    )
                ) {
                    return
                }


                const id =
                    Number(
                        card.dataset.openModpack
                    )


                const modpack =
                    modpacks.find(
                        item => item.id === id
                    )


                if (modpack) {
                    renderModpackDetail(modpack)
                }

            }
        )
    })
}


function modpackCard(modpack) {

    const loader =
        String(modpack.loader || '')
            .toUpperCase()


    const published =
        modpack.status === 'published'


    return `

        <article
            class="modpack-card"
            data-open-modpack="${modpack.id}"
        >

            <div class="modpack-card-top">

                <div class="pack-symbol">
                    ${escapeHTML(
                        modpack.name
                            .substring(0, 2)
                            .toUpperCase()
                    )}
                </div>


                <div class="pack-status ${published ? 'published' : 'draft'}">

                    <span></span>

                    ${published
                        ? 'Publicado'
                        : 'Borrador'
                    }

                </div>

            </div>


            <div class="modpack-info">

                <h2>
                    ${escapeHTML(modpack.name)}
                </h2>

                <div class="modpack-slug">
                    ${escapeHTML(modpack.slug)}
                </div>

                <p>
                    ${escapeHTML(
                        modpack.description ||
                        'Sin descripción'
                    )}
                </p>

            </div>


            <div class="modpack-meta">

                <div>
                    <span>MINECRAFT</span>
                    <strong>
                        ${escapeHTML(
                            modpack.minecraft_version
                        )}
                    </strong>
                </div>

                <div>
                    <span>LOADER</span>
                    <strong>
                        ${escapeHTML(loader)}
                        ${escapeHTML(
                            modpack.loader_version
                        )}
                    </strong>
                </div>

            </div>


            <div class="modpack-server">

                <span class="server-dot"></span>

                ${escapeHTML(
                    modpack.server_address ||
                    'Sin servidor'
                )}

            </div>


            <div class="modpack-actions">

                <button
                    class="card-button"
                    data-edit="${modpack.id}"
                >
                    Editar
                </button>

                <button
                    class="card-button danger"
                    data-delete="${modpack.id}"
                >
                    Eliminar
                </button>

            </div>

        </article>
    `
}


// ============================================================
// CREATE / EDIT MODAL
// ============================================================

function openModpackModal(modpack = null) {

    const overlay =
        document.getElementById('modalOverlay')


    const editing =
        Boolean(modpack)


    overlay.innerHTML = `

        <div class="modal">

            <div class="modal-header">

                <div>
                    <div class="page-eyebrow">
                        ${editing ? 'EDITAR' : 'NUEVO'}
                    </div>

                    <h2>
                        ${editing
                            ? 'Editar modpack'
                            : 'Nuevo modpack'
                        }
                    </h2>
                </div>


                <button
                    class="modal-close"
                    id="modalClose"
                    type="button"
                >
                    ×
                </button>

            </div>


            <form id="modpackForm">

                <div class="form-grid">

                    <div class="form-group">
                        <label>Nombre *</label>

                        <input
                            id="packName"
                            value="${attribute(modpack?.name)}"
                            placeholder="FailZone"
                            required
                        >
                    </div>


                    <div class="form-group">
                        <label>Slug *</label>

                        <input
                            id="packSlug"
                            value="${attribute(modpack?.slug)}"
                            placeholder="failzone"
                            required
                        >
                    </div>


                    <div class="form-group full">
                        <label>Descripción</label>

                        <textarea
                            id="packDescription"
                            placeholder="Describe brevemente el modpack..."
                        >${escapeHTML(modpack?.description || '')}</textarea>
                    </div>


                    <div class="form-group">
                        <label>Versión de Minecraft *</label>

                        <input
                            id="packMinecraft"
                            value="${attribute(modpack?.minecraft_version)}"
                            placeholder="1.20.1"
                            required
                        >
                    </div>


                    <div class="form-group">
                        <label>Loader *</label>

                        <select id="packLoader">

                            ${loaderOption(
                                'forge',
                                'Forge',
                                modpack?.loader
                            )}

                            ${loaderOption(
                                'neoforge',
                                'NeoForge',
                                modpack?.loader
                            )}

                            ${loaderOption(
                                'fabric',
                                'Fabric',
                                modpack?.loader
                            )}

                            ${loaderOption(
                                'quilt',
                                'Quilt',
                                modpack?.loader
                            )}

                        </select>
                    </div>


                    <div class="form-group">
                        <label>Versión del loader *</label>

                        <input
                            id="packLoaderVersion"
                            value="${attribute(modpack?.loader_version)}"
                            placeholder="47.4.20"
                            required
                        >
                    </div>


                    <div class="form-group">
                        <label>Estado</label>

                        <select id="packStatus">

                            <option
                                value="draft"
                                ${modpack?.status !== 'published'
                                    ? 'selected'
                                    : ''
                                }
                            >
                                Borrador
                            </option>

                            <option
                                value="published"
                                ${modpack?.status === 'published'
                                    ? 'selected'
                                    : ''
                                }
                            >
                                Publicado
                            </option>

                        </select>
                    </div>


                    <div class="form-group full">
                        <label>Dirección del servidor</label>

                        <input
                            id="packServer"
                            value="${attribute(modpack?.server_address)}"
                            placeholder="play.example.com"
                        >
                    </div>

                </div>


                <div
                    class="form-error"
                    id="modpackFormError"
                ></div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        id="cancelModal"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        ${editing
                            ? 'Guardar cambios'
                            : 'Crear modpack'
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
        .getElementById('modalClose')
        .addEventListener('click', close)


    document
        .getElementById('cancelModal')
        .addEventListener('click', close)


    overlay.addEventListener(
        'click',
        event => {

            if (event.target === overlay) {
                close()
            }
        }
    )


    // Crear slug automáticamente

    if (!editing) {

        const name =
            document.getElementById('packName')

        const slug =
            document.getElementById('packSlug')


        name.addEventListener('input', () => {

            slug.value =
                createSlug(name.value)
        })
    }


    document
        .getElementById('modpackForm')
        .addEventListener(
            'submit',
            async event => {

                event.preventDefault()

                await submitModpack(
                    modpack,
                    close,
                    event.currentTarget
                )
            }
        )
}


// ============================================================
// SAVE
// ============================================================

async function submitModpack(
    existing,
    close,
    form
) {

    const error =
        document.getElementById(
            'modpackFormError'
        )


    const button =
        form.querySelector(
            'button[type="submit"]'
        )


    const data = {

        name:
            document
                .getElementById('packName')
                .value
                .trim(),

        slug:
            document
                .getElementById('packSlug')
                .value
                .trim()
                .toLowerCase(),

        description:
            document
                .getElementById('packDescription')
                .value
                .trim(),

        minecraftVersion:
            document
                .getElementById('packMinecraft')
                .value
                .trim(),

        loader:
            document
                .getElementById('packLoader')
                .value,

        loaderVersion:
            document
                .getElementById('packLoaderVersion')
                .value
                .trim(),

        serverAddress:
            document
                .getElementById('packServer')
                .value
                .trim(),

        status:
            document
                .getElementById('packStatus')
                .value
    }


    error.textContent = ''

    button.disabled = true
    button.textContent = 'Guardando...'


    try {

        if (existing) {

            await updateModpack(
                existing.id,
                data
            )

            showToast(
                'Modpack actualizado'
            )

        } else {

            await createModpack(data)

            showToast(
                'Modpack creado'
            )
        }


        close()

        await loadModpacks()


    } catch (err) {

        error.textContent =
            err.message

        button.disabled = false

        button.textContent =
            existing
                ? 'Guardar cambios'
                : 'Crear modpack'
    }
}


// ============================================================
// DELETE
// ============================================================

function confirmDelete(modpack) {

    const overlay =
        document.getElementById('modalOverlay')


    overlay.innerHTML = `

        <div class="modal confirm-modal">

            <div class="danger-symbol">
                !
            </div>

            <h2>
                Eliminar modpack
            </h2>

            <p>
                Vas a eliminar
                <strong>
                    ${escapeHTML(modpack.name)}
                </strong>.

                Esta acción no se puede deshacer.
            </p>


            <div class="modal-actions">

                <button
                    class="secondary-button"
                    id="cancelDelete"
                >
                    Cancelar
                </button>

                <button
                    class="danger-button"
                    id="confirmDelete"
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
        .getElementById('cancelDelete')
        .addEventListener(
            'click',
            close
        )


    document
        .getElementById('confirmDelete')
        .addEventListener(
            'click',
            async () => {

                try {

                    await deleteModpack(
                        modpack.id
                    )

                    close()

                    showToast(
                        'Modpack eliminado'
                    )

                    await loadModpacks()

                } catch (error) {

                    showToast(
                        error.message,
                        true
                    )
                }
            }
        )
}


// ============================================================
// TOAST
// ============================================================

function showToast(
    message,
    error = false
) {

    const container =
        document.getElementById(
            'toastContainer'
        )


    const toast =
        document.createElement('div')


    toast.className =
        `toast ${error ? 'error' : ''}`


    toast.textContent = message


    container.appendChild(toast)


    requestAnimationFrame(() => {
        toast.classList.add('show')
    })


    setTimeout(() => {

        toast.classList.remove('show')

        setTimeout(
            () => toast.remove(),
            250
        )

    }, 3000)
}


// ============================================================
// HELPERS
// ============================================================

function createSlug(value) {

    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
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