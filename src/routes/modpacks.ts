import { Hono } from 'hono'

export const modpacks = new Hono()


// ============================================================
// GET ALL MODPACKS
// ============================================================

modpacks.get('/', (c) => {
    return c.json({
        modpacks: [
            {
                id: 1,
                name: 'FailZone',
                slug: 'failzone',
                minecraftVersion: '1.20.1',
                loader: 'forge',
                loaderVersion: '47.4.20',
                status: 'published'
            }
        ]
    })
})


// ============================================================
// GET MODPACK
// ============================================================

modpacks.get('/:slug', (c) => {

    const slug = c.req.param('slug')

    return c.json({
        id: 1,
        name: 'FailZone',
        slug,
        minecraftVersion: '1.20.1',
        loader: 'forge',
        loaderVersion: '47.4.20',
        status: 'published'
    })
})