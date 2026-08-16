const button =
    document.getElementById('loadModpacks')

const container =
    document.getElementById('modpacks')


button.addEventListener('click', async () => {

    try {

        const response =
            await fetch('/api/v1/modpacks')

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            )
        }

        const data =
            await response.json()

        console.log(data)

        container.innerHTML = ''

        data.modpacks.forEach((modpack) => {

            const element =
                document.createElement('div')

            element.innerHTML = `
                <h2>${modpack.name}</h2>

                <p>
                    Minecraft:
                    ${modpack.minecraftVersion}
                </p>

                <p>
                    ${modpack.loader}
                    ${modpack.loaderVersion}
                </p>
            `

            container.appendChild(element)

        })

    } catch (error) {

        console.error(error)

        container.textContent =
            'No se pudieron cargar los modpacks.'

    }

})