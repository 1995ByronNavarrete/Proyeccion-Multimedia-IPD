declare module 'mammoth' {
  interface ConvertResult {
    value: string
    messages: unknown[]
  }

  interface ConvertOptions {
    path?: string
    buffer?: Buffer
  }

  export function convertToHtml(input: ConvertOptions): Promise<ConvertResult>
  export function extractRawText(input: ConvertOptions): Promise<ConvertResult>
}
