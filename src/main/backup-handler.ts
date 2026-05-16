import { dialog, app, ipcMain } from 'electron'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { queryAll, execute, flushDatabase, getDbPath } from './database'

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:create', async () => {
    try {
      flushDatabase()
      const backup = {
        version: '1.0',
        fecha: new Date().toISOString(),
        db: readFileSync(getDbPath()).toString('base64')
      }

      const result = await dialog.showSaveDialog({
        defaultPath: join(app.getPath('desktop'), `backup-ipd-${new Date().toISOString().slice(0, 10)}.json`),
        filters: [{ name: 'Backup IPD', extensions: ['json'] }]
      })
      if (result.canceled || !result.filePath) return { success: false, error: 'Cancelado' }

      writeFileSync(result.filePath, JSON.stringify(backup), 'utf-8')
      return { success: true, data: { path: result.filePath } }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('backup:restore', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Backup IPD', extensions: ['json'] }]
      })
      if (result.canceled || !result.filePaths.length) return { success: false, error: 'Cancelado' }

      const raw = readFileSync(result.filePaths[0], 'utf-8')
      const backup = JSON.parse(raw)
      if (!backup.db) return { success: false, error: 'Backup inválido' }

      const buffer = Buffer.from(backup.db, 'base64')
      writeFileSync(getDbPath(), buffer)
      return { success: true, data: { path: result.filePaths[0] } }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
