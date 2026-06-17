/// <reference types="vite/client" />

declare module 'mammoth' {
  export interface ConversionResult { value: string; messages: unknown[] }
  export interface ExtractOptions { arrayBuffer?: ArrayBuffer }
  export function extractRawText(options: ExtractOptions): Promise<ConversionResult>;
  const _default: { extractRawText(options: ExtractOptions): Promise<ConversionResult> };
  export default _default;
}
