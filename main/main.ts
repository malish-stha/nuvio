import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers/create-window'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
    },
  })

  // Window IPC controls
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    mainWindow.close()
  })

  ipcMain.handle('window-is-maximized', async () => {
    return mainWindow.isMaximized()
  })

  if (isProd) {
    await mainWindow.loadURL('app://./')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

import { desktopCapturer } from 'electron'

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

ipcMain.handle('get-screen-sources', async () => {
  const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] })
  return sources.map(s => ({
    id: s.id,
    name: s.name,
    thumbnailUrl: s.thumbnail.toDataURL()
  }))
})
