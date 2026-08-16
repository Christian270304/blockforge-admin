import { Hono } from 'hono'

type Bindings = {
    DB: D1Database
}

export const modrinth = new Hono<{
    Bindings: Bindings
}>()

const MODRINTH_API = 'https://api.modrinth.com/v2'


// ============================================================
// SEARCH PROJECTS
// ============================================================

modrinth.get('/search', async (c) => {

    const query = c.req.query('q')?.trim()

    if (!query) {
        return c.json(
            {
                error: 'Debes indicar una búsqueda'
            },
            400
        )
    }


    try {

        const params = new URLSearchParams({
            query,
            limit: '20',
            index: 'relevance',
            facets: JSON.stringify([
                ['project_type:mod']
            ])
        })


        const response = await fetch(
            `${MODRINTH_API}/search?${params.toString()}`,
            {
                headers: {
                    'User-Agent':
                        'BlockForge-Admin/1.0'
                }
            }
        )


        if (!response.ok) {
            throw new Error(
                `Modrinth respondió ${response.status}`
            )
        }


        const data: any =
            await response.json()


        const projects =
            data.hits.map((project: any) => ({
                projectId: project.project_id,
                slug: project.slug,
                title: project.title,
                description: project.description,
                iconUrl: project.icon_url,
                author: project.author,
                downloads: project.downloads,
                follows: project.follows,
                categories: project.categories || [],
                versions: project.versions || []
            }))


        return c.json({
            projects
        })


    } catch (error) {

        console.error(
            'Error buscando en Modrinth:',
            error
        )


        return c.json(
            {
                error:
                    'No se pudo consultar Modrinth'
            },
            502
        )
    }
})


// ============================================================
// GET COMPATIBLE VERSIONS
// ============================================================

modrinth.get(
    '/projects/:projectId/versions',
    async (c) => {

        const projectId =
            c.req.param('projectId')

        const minecraft =
            c.req.query('minecraft')?.trim()

        const loader =
            c.req.query('loader')
                ?.trim()
                .toLowerCase()


        if (!minecraft || !loader) {

            return c.json(
                {
                    error:
                        'minecraft y loader son obligatorios'
                },
                400
            )
        }


        try {

            const params =
                new URLSearchParams()


            params.set(
                'game_versions',
                JSON.stringify([minecraft])
            )


            params.set(
                'loaders',
                JSON.stringify([loader])
            )


            const response =
                await fetch(
                    `${MODRINTH_API}/project/${encodeURIComponent(projectId)}/version?${params}`,
                    {
                        headers: {
                            'User-Agent':
                                'BlockForge-Admin/1.0'
                        }
                    }
                )


            if (!response.ok) {

                if (response.status === 404) {
                    return c.json(
                        {
                            error:
                                'Proyecto no encontrado'
                        },
                        404
                    )
                }


                throw new Error(
                    `Modrinth respondió ${response.status}`
                )
            }


            const data: any[] =
                await response.json()


            const versions =
                data.map(version => {

                    const primaryFile =
                        version.files.find(
                            (file: any) => file.primary
                        ) || version.files[0]


                    return {

                        versionId:
                            version.id,

                        projectId:
                            version.project_id,

                        name:
                            version.name,

                        versionNumber:
                            version.version_number,

                        versionType:
                            version.version_type,

                        published:
                            version.date_published,

                        loaders:
                            version.loaders,

                        gameVersions:
                            version.game_versions,

                        filename:
                            primaryFile?.filename || null,

                        downloadUrl:
                            primaryFile?.url || null,

                        size:
                            primaryFile?.size || null,

                        sha256:
                            primaryFile?.hashes?.sha256 || null,

                        dependencies:
                            version.dependencies || []
                    }
                })


            return c.json({
                projectId,
                minecraft,
                loader,
                versions
            })


        } catch (error) {

            console.error(
                'Error obteniendo versiones:',
                error
            )


            return c.json(
                {
                    error:
                        'No se pudieron obtener las versiones'
                },
                502
            )
        }
    }
)