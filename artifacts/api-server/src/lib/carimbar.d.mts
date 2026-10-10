export const TIPOS_IMAGEM: string[];
export const TIPO_PDF: string;

export class ErroDeArquivo extends Error {
  status: number;
  constructor(mensagem: string, status?: number);
}

export interface ResultadoCarimbo {
  buffer: Buffer;
  tipo: string;
  extensao: string;
}

export function carimbarImagem(buffer: Buffer, tipo: string): Promise<ResultadoCarimbo>;
export function carimbarPdf(buffer: Buffer): Promise<ResultadoCarimbo>;
