// Aplica o carimbo (SVG) em imagens e PDFs. Roda só no servidor.
// Dependências: npm i sharp pdf-lib
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { gerarCarimboSvg } from "./carimbo.mjs";

const SVG_LARGURA = 640; // largura (viewBox) do SVG do carimbo

export const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
export const TIPO_PDF = "application/pdf";

export class ErroDeArquivo extends Error {
  constructor(mensagem, status = 422) {
    super(mensagem);
    this.status = status;
  }
}

// Rasteriza o SVG do carimbo numa largura exata, em pixels.
async function carimboPng(svg, largura) {
  const w = Math.max(1, Math.round(largura));
  const density = Math.min(1200, Math.max(72, (72 * w) / SVG_LARGURA));
  return sharp(Buffer.from(svg), { density })
    .resize({ width: w })
    .png()
    .toBuffer();
}

/** Carimba uma imagem (JPEG, PNG ou WEBP). Devolve { buffer, tipo, extensao }. */
export async function carimbarImagem(buffer, tipo) {
  let base;
  try {
    // rotate() aplica a orientação EXIF antes de medir a imagem
    base = await sharp(buffer).rotate().toBuffer({ resolveWithObject: true });
  } catch {
    throw new ErroDeArquivo("Não foi possível ler esta imagem.");
  }
  const { width: W, height: H } = base.info;

  // O carimbo ocupa até 45% da largura e 50% da altura, no canto inferior direito.
  let largura = W * 0.45;
  if ((largura * 400) / SVG_LARGURA > H * 0.5) largura = (H * 0.5 * SVG_LARGURA) / 400;
  const stamp = await carimboPng(gerarCarimboSvg(), largura);
  const meta = await sharp(stamp).metadata();
  const margem = Math.round(W * 0.03);

  const img = sharp(base.data).composite([
    {
      input: stamp,
      left: Math.max(0, W - meta.width - margem),
      top: Math.max(0, H - meta.height - margem),
    },
  ]);

  if (tipo === "image/jpeg") {
    return { buffer: await img.jpeg({ quality: 92 }).toBuffer(), tipo: "image/jpeg", extensao: "jpg" };
  }
  return { buffer: await img.png().toBuffer(), tipo: "image/png", extensao: "png" };
}

/** Carimba todas as páginas de um PDF. Devolve { buffer, tipo, extensao }. */
export async function carimbarPdf(buffer) {
  let pdf;
  try {
    pdf = await PDFDocument.load(buffer);
  } catch {
    throw new ErroDeArquivo("Não foi possível ler este PDF. Ele pode estar protegido por senha ou corrompido.");
  }

  const svg = gerarCarimboSvg(); // mesmo protocolo em todas as páginas
  const png = await pdf.embedPng(await carimboPng(svg, 1200));

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const w = Math.min(width * 0.38, height * 0.4 * (png.width / png.height));
    const h = (w * png.height) / png.width;
    const margem = width * 0.03;
    page.drawImage(png, { x: width - w - margem, y: margem, width: w, height: h });
  }

  const out = await pdf.save();
  return { buffer: Buffer.from(out), tipo: TIPO_PDF, extensao: "pdf" };
}
