export function fileUrl(p: string): string {
  return p.startsWith('file://') ? p : `file:///${p.replace(/\\/g, '/')}`
}
