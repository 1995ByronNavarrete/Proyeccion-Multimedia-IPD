import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export interface IpcResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

export function ok<T>(data: T): IpcResponse<T> {
  return { success: true, data }
}

export function fail(error: string): IpcResponse {
  return { success: false, error }
}

export function appDocsPath(): string {
  const userPath = join(app.getPath('userData'), 'DesktopAppIPD')
  if (!existsSync(userPath)) mkdirSync(userPath, { recursive: true })
  return userPath
}

export function getBundledResourcesPath(): string | null {
  try {
    if (process.resourcesPath) {
      const resourcePath = join(process.resourcesPath, 'DesktopAppIPD')
      if (existsSync(resourcePath)) return resourcePath
    }
  } catch {}
  try {
    const devPath = join(__dirname, '..', '..', 'resources', 'DesktopAppIPD')
    if (existsSync(devPath)) return devPath
  } catch {}
  return null
}

export function getBundledDbPath(): string | null {
  try {
    if (process.resourcesPath) {
      const prodPath = join(process.resourcesPath, 'bible-data.db')
      if (existsSync(prodPath)) return prodPath
    }
  } catch {}
  try {
    const devPath = join(__dirname, '..', '..', 'resources', 'bible-data.db')
    if (existsSync(devPath)) return devPath
  } catch {}
  try {
    const altPath = join(__dirname, '..', 'resources', 'bible-data.db')
    if (existsSync(altPath)) return altPath
  } catch {}
  return null
}

export function getBibleBackupPath(): string | null {
  const bundled = getBundledResourcesPath()
  if (bundled) {
    const p = join(bundled, 'BDBiblia', 'biblia-backup.db')
    if (existsSync(p)) return p
  }
  const userPath = join(app.getPath('userData'), 'DesktopAppIPD', 'BDBiblia', 'biblia-backup.db')
  if (existsSync(userPath)) return userPath
  return null
}

export function getBundledDataDbPath(): string | null {
  try {
    if (process.resourcesPath) {
      const p = join(process.resourcesPath, 'bundled-data.db')
      if (existsSync(p)) return p
    }
  } catch {}
  try {
    const p = join(__dirname, '..', '..', 'resources', 'bundled-data.db')
    if (existsSync(p)) return p
  } catch {}
  return null
}

export const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml'
}

export function getMime(ext: string): string {
  return IMAGE_MIME[ext.toLowerCase()] || 'image/png'
}

export const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'])

export const AUDIO_EXTS = new Set(['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.opus', '.wma'])
export const VIDEO_EXTS = new Set(['.mp4', '.avi', '.mkv', '.mov', '.webm', '.m4v', '.wmv', '.flv'])
export const DOCUMENT_EXTS = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.rtf', '.odt', '.odp', '.ods', '.csv'])

export function getMediaType(ext: string): 'audio' | 'video' | 'document' | null {
  const lower = ext.toLowerCase()
  if (AUDIO_EXTS.has(lower)) return 'audio'
  if (VIDEO_EXTS.has(lower)) return 'video'
  if (DOCUMENT_EXTS.has(lower)) return 'document'
  return null
}
