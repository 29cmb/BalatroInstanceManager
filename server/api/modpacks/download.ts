import { Express } from "express"
import database from "../../modules/database"
import AdmZip from "adm-zip"
import { dir as tmpDir } from "tmp-promise"
import fs from "fs"
import path from "path"
import axios from "axios"

const visits = {} as {[mod: string]: string[]}

export default (app: Express) => {
    app.get("/api/v1/modpacks/download/:id", async (req, res) => {
        const ip = req.ip
        const { id } = req.params

        const modpack = await database.methods.GetModpack(id)
        if(!modpack) {
            res.status(404).json({ success: false, message: "Modpack does not exist" })
            return
        }

        if (!visits[id]) visits[id] = [];
        if(!visits[id].some(value => value === ip) && ip !== undefined) {
            visits[id].push(ip)
            setTimeout(() => {
                visits[id] = visits[id].filter(v => v !== ip)
            }, 1000 * 60 * 30)
            database.methods.ModpackDownload(id)
        }

        const { path: tempDirPath, cleanup } = await tmpDir({ unsafeCleanup: true })
        try {
            for (const mod of modpack.mods) {
                const modInModpack = await database.methods.GetMod(mod.id)
                if(!modInModpack) continue
                const release = await database.methods.GetRelease(mod.id, mod.tag)
                if(!release || !release.download) continue
                const response = await axios.get(release.download, { responseType: "arraybuffer" })
                const zip = new AdmZip(response.data)
                zip.extractAllTo(tempDirPath, true)
            }

            const outputZip = new AdmZip()
            const addFiles = (dir: string, base = "") => {
                const files = fs.readdirSync(dir)
                for (const file of files) {
                    const fullPath = path.join(dir, file)
                    const relPath = path.join(base, file)
                    if (fs.statSync(fullPath).isDirectory()) {
                        addFiles(fullPath, relPath)
                    } else {
                        outputZip.addLocalFile(fullPath, base)
                    }
                }
            }

            addFiles(tempDirPath)
            const buffer = outputZip.toBuffer()
            res.setHeader("Content-Type", "application/zip")
            res.setHeader("Content-Disposition", `attachment; filename="${modpack.name || "modpack"}.zip"`)
            res.send(buffer)
        } catch (err: Error & any) {
            console.error(`❌ | Error when attempting to download modpack: ${err}`)
            res.status(500).json({ success: false, message: "Failed to create modpack zip" })
        } finally {
            cleanup()
        }
    })

    return {
        method: "GET",
        route: "/api/v1/modpacks/download/:id"
    }
}