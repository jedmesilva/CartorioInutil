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

export interface ProgressoCarimbo {
  mensagem: string;
  paginaAtual?: number;
  totalPaginas?: number;
}

export type CallbackProgressoCarimbo = (progresso: ProgressoCarimbo) => void;

export function carimbarImagem(
  buffer: Buffer,
  tipo: string,
  onProgress?: CallbackProgressoCarimbo,
): Promise<ResultadoCarimbo>;
export function carimbarPdf(
  buffer: Buffer,
  onProgress?: CallbackProgressoCarimbo,
): Promise<ResultadoCarimbo>;
