import { Controller } from "../Types";
import { app, BrowserWindow } from "electron";
import * as path from "path";
import Logging from "../util/Logging";
import IPCController from "./IPCController";
import Registry from "../util/Registry";

export default class ElectronController implements Controller {
    public name: string = "ElectronController";
    public description: string = "Controller for Electron specific functionality.";
    public version: string = "1.0.0";
    private IPC: IPCController | null = null;
    public mainWindow: BrowserWindow | null = null;

    public async init(): Promise<void> {
        this.IPC = (await Registry.AwaitController("IPCController")) as IPCController

        app.whenReady().then(() => {
            if(this.IPC) {
                this.IPC.SetupIPC()
            }
            
            this.createWindow()
        
            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow()
                }
            })
        })
        
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })
    }

    protected createWindow(): void {
        Logging.info("Creating main window...")
        
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 600,
            minWidth: 1200,
            minHeight: 600,
            title: "Negative Manager",
            icon: path.join(__dirname, "../..", "icons", "512.png"),
            webPreferences: {
                preload: path.join(__dirname, "..", "util", "preload.js")
            }
        })

        this.mainWindow.maximize()

        if (!app.isPackaged) {
            this.mainWindow.loadURL('http://localhost:11731');
        } else {
            // this.mainWindow.setMenu(null)
            this.mainWindow.loadFile(path.join(__dirname, '../../', 'client', 'out', 'index.html'));
        }
    }
}