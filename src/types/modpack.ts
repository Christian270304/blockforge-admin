export type ModLoader =
    | 'forge'
    | 'neoforge'
    | 'fabric'
    | 'quilt'


export type ModpackStatus =
    | 'draft'
    | 'published'


export interface Modpack {

    id: number

    name: string
    slug: string

    description: string | null

    minecraftVersion: string

    loader: ModLoader
    loaderVersion: string

    serverAddress: string | null

    status: ModpackStatus

    createdAt: string
    updatedAt: string
}