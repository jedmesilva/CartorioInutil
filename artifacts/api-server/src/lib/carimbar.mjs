// Aplica o carimbo (SVG) em imagens e PDFs. Roda só no servidor.
// Dependências: npm i sharp pdf-lib
import { spawn } from "node:child_process";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { gerarCarimboSvg, gerarProtocolo } from "./carimbo.mjs";

const SVG_LARGURA = 1080; // largura (viewBox) do SVG do carimbo
const SVG_ALTURA = 688;
const INCLINACAO_GRAUS = -8;
const PROPORCAO_ALTURA = SVG_ALTURA / SVG_LARGURA;
const COR_SELO_VERDE = "#0f4c2d";
const COR_SELO_CLARO = "#f7f5ed";
const LADO_AMOSTRA_CONTRASTE = 64;
const LADO_MAXIMO_PREVIA_PDF = 768;
const LIMITE_BYTES_PREVIA_PDF = 8 * 1024 * 1024;
const TEMPO_LIMITE_PREVIA_PDF_MS = 20_000;

const LUMINANCIA_SRGB = Float32Array.from({ length: 256 }, (_, canal) => {
  const valor = canal / 255;
  return valor <= 0.04045
    ? valor / 12.92
    : ((valor + 0.055) / 1.055) ** 2.4;
});

function luminanciaHex(cor) {
  const canais = cor.match(/[a-f\d]{2}/gi)?.map((canal) => Number.parseInt(canal, 16));
  if (!canais || canais.length !== 3) throw new Error("Cor de selo inválida.");
  return (
    LUMINANCIA_SRGB[canais[0]] * 0.2126 +
    LUMINANCIA_SRGB[canais[1]] * 0.7152 +
    LUMINANCIA_SRGB[canais[2]] * 0.0722
  );
}

const LUMINANCIA_SELO_VERDE = luminanciaHex(COR_SELO_VERDE);
const LUMINANCIA_SELO_CLARO = luminanciaHex(COR_SELO_CLARO);

function razaoContraste(a, b) {
  const maisClaro = Math.max(a, b);
  const maisEscuro = Math.min(a, b);
  return (maisClaro + 0.05) / (maisEscuro + 0.05);
}

function escolherCorDeMaiorContraste({ data, info }) {
  let pontuacaoVerde = 0;
  let pontuacaoClara = 0;
  let pesoTotal = 0;

  for (let indice = 0; indice < data.length; indice += info.channels) {
    const alpha = info.channels >= 4 ? data[indice + 3] / 255 : 1;
    if (alpha < 0.12) continue;

    const luminancia =
      LUMINANCIA_SRGB[data[indice]] * 0.2126 +
      LUMINANCIA_SRGB[data[indice + 1]] * 0.7152 +
      LUMINANCIA_SRGB[data[indice + 2]] * 0.0722;

    // A média geométrica evita escolher a cor que só contrasta em alguns pixels
    // extremos quando a maior parte da região tem outra luminosidade.
    pontuacaoVerde += Math.log(razaoContraste(luminancia, LUMINANCIA_SELO_VERDE)) * alpha;
    pontuacaoClara += Math.log(razaoContraste(luminancia, LUMINANCIA_SELO_CLARO)) * alpha;
    pesoTotal += alpha;
  }

  // Em áreas totalmente transparentes, o fundo real não pode ser inferido.
  return pesoTotal > 0 && pontuacaoClara > pontuacaoVerde
    ? COR_SELO_CLARO
    : COR_SELO_VERDE;
}

async function escolherCorNaRegiao(buffer, left, top, width, height) {
  const x = Math.max(0, Math.floor(left));
  const y = Math.max(0, Math.floor(top));
  const roiWidth = Math.max(1, Math.ceil(width));
  const roiHeight = Math.max(1, Math.ceil(height));
  const amostra = await sharp(buffer)
    .extract({ left: x, top: y, width: roiWidth, height: roiHeight })
    .resize({
      width: LADO_AMOSTRA_CONTRASTE,
      height: LADO_AMOSTRA_CONTRASTE,
      fit: "fill",
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return escolherCorDeMaiorContraste(amostra);
}

function renderizarPaginaPdf(buffer, numeroPagina) {
  return new Promise((resolve, reject) => {
    const processo = spawn(
      "pdftoppm",
      [
        "-f",
        String(numeroPagina),
        "-l",
        String(numeroPagina),
        "-scale-to",
        String(LADO_MAXIMO_PREVIA_PDF),
        "-png",
        "-singlefile",
        "-",
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    const partes = [];
    const erros = [];
    let bytesRecebidos = 0;
    let bytesErro = 0;
    let excedeuLimite = false;
    let encerrado = false;

    const rejeitar = (erro) => {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(temporizador);
      reject(erro);
    };

    const temporizador = setTimeout(() => {
      processo.kill("SIGKILL");
      rejeitar(
        new ErroDeArquivo(
          "Não foi possível analisar o contraste deste PDF.",
        ),
      );
    }, TEMPO_LIMITE_PREVIA_PDF_MS);
    temporizador.unref();

    processo.on("error", () => {
      rejeitar(
        new ErroDeArquivo(
          "Não foi possível analisar o contraste deste PDF.",
        ),
      );
    });
    processo.stdout.on("data", (parte) => {
      bytesRecebidos += parte.length;
      if (bytesRecebidos > LIMITE_BYTES_PREVIA_PDF) {
        excedeuLimite = true;
        processo.kill("SIGKILL");
        rejeitar(
          new ErroDeArquivo(
            "Não foi possível analisar o contraste deste PDF.",
          ),
        );
        return;
      }
      partes.push(parte);
    });
    processo.stderr.on("data", (parte) => {
      if (bytesErro >= 8_192) return;
      const trecho = parte.subarray(0, 8_192 - bytesErro);
      erros.push(trecho);
      bytesErro += trecho.length;
    });
    processo.stdin.on("error", () => {
      // A saída não zero do processo é tratada pelo evento "close".
    });
    processo.on("close", (codigo) => {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(temporizador);
      if (codigo !== 0 || excedeuLimite || bytesRecebidos === 0) {
        reject(
          new ErroDeArquivo(
            "Não foi possível analisar o contraste deste PDF.",
          ),
        );
        return;
      }
      resolve(Buffer.concat(partes, bytesRecebidos));
    });
    processo.stdin.end(buffer);
  });
}

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
    .rotate(INCLINACAO_GRAUS, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Calcula a escala pelo retângulo ocupado depois da rotação, evitando cortes.
function larguraCarimboInclinado(limiteLargura, limiteAltura) {
  const angulo = (Math.abs(INCLINACAO_GRAUS) * Math.PI) / 180;
  const cos = Math.cos(angulo);
  const sin = Math.sin(angulo);
  const fatorLargura = cos + PROPORCAO_ALTURA * sin;
  const fatorAltura = sin + PROPORCAO_ALTURA * cos;
  return Math.min(limiteLargura / fatorLargura, limiteAltura / fatorAltura);
}

/** Carimba uma imagem (JPEG, PNG ou WEBP). Devolve { buffer, tipo, extensao }. */
export async function carimbarImagem(buffer, tipo, onProgress = () => {}) {
  onProgress({ mensagem: "Lendo e preparando a imagem..." });
  let base;
  try {
    // rotate() aplica a orientação EXIF antes de medir a imagem
    base = await sharp(buffer).rotate().toBuffer({ resolveWithObject: true });
  } catch {
    throw new ErroDeArquivo("Não foi possível ler esta imagem.");
  }
  const { width: W, height: H } = base.info;

  // O carimbo inclinado ocupa até 45% da largura e 50% da altura, no canto inferior direito.
  onProgress({ mensagem: "Preparando o selo..." });
  const largura = larguraCarimboInclinado(W * 0.45, H * 0.5);
  const metaSelo = await sharp(
    await carimboPng(gerarCarimboSvg({ cor: COR_SELO_VERDE }), largura),
  ).metadata();
  const margem = Math.round(W * 0.03);
  const left = Math.max(0, W - metaSelo.width - margem);
  const top = Math.max(0, H - metaSelo.height - margem);
  const cor = await escolherCorNaRegiao(
    base.data,
    left,
    top,
    metaSelo.width,
    metaSelo.height,
  );
  const data = new Date();
  const protocolo = gerarProtocolo();
  const stamp = await carimboPng(
    gerarCarimboSvg({ data, protocolo, cor }),
    largura,
  );
  const meta = await sharp(stamp).metadata();

  const img = sharp(base.data).composite([
    {
      input: stamp,
      left: Math.max(0, W - meta.width - margem),
      top: Math.max(0, H - meta.height - margem),
    },
  ]);

  onProgress({ mensagem: "Aplicando o selo e gerando a imagem final..." });
  if (tipo === "image/jpeg") {
    return { buffer: await img.jpeg({ quality: 92 }).toBuffer(), tipo: "image/jpeg", extensao: "jpg" };
  }
  return { buffer: await img.png().toBuffer(), tipo: "image/png", extensao: "png" };
}

/** Carimba todas as páginas de um PDF. Devolve { buffer, tipo, extensao }. */
export async function carimbarPdf(buffer, onProgress = () => {}) {
  onProgress({ mensagem: "Abrindo o PDF..." });
  let pdf;
  try {
    pdf = await PDFDocument.load(buffer);
  } catch {
    throw new ErroDeArquivo("Não foi possível ler este PDF. Ele pode estar protegido por senha ou corrompido.");
  }

  onProgress({ mensagem: "Preparando o selo..." });
  const data = new Date();
  const protocolo = gerarProtocolo();
  const [pngVerde, pngClaro] = await Promise.all([
    carimboPng(
      gerarCarimboSvg({ data, protocolo, cor: COR_SELO_VERDE }),
      1200,
    ),
    carimboPng(
      gerarCarimboSvg({ data, protocolo, cor: COR_SELO_CLARO }),
      1200,
    ),
  ]);
  const [seloVerde, seloClaro] = await Promise.all([
    pdf.embedPng(pngVerde),
    pdf.embedPng(pngClaro),
  ]);

  const pages = pdf.getPages();
  for (const [index, page] of pages.entries()) {
    const { width, height } = page.getSize();
    const w = Math.min(
      width * 0.38,
      height * 0.4 * (seloVerde.width / seloVerde.height),
    );
    const h = (w * seloVerde.height) / seloVerde.width;
    const margem = width * 0.03;
    const x = width - w - margem;
    const y = margem;

    onProgress({
      mensagem: `Analisando contraste da página ${index + 1} de ${pages.length}...`,
      paginaAtual: index + 1,
      totalPaginas: pages.length,
    });
    let previa;
    try {
      previa = await renderizarPaginaPdf(buffer, index + 1);
      const rotacao = ((page.getRotation().angle % 360) + 360) % 360;
      if (rotacao !== 0) {
        previa = await sharp(previa)
          .rotate(360 - rotacao)
          .png()
          .toBuffer();
      }
    } catch (error) {
      if (error instanceof ErroDeArquivo) throw error;
      throw new ErroDeArquivo(
        "Não foi possível analisar o contraste deste PDF.",
      );
    }

    const { width: previaWidth, height: previaHeight } =
      await sharp(previa).metadata();
    const escalaX = previaWidth / width;
    const escalaY = previaHeight / height;
    const cor = await escolherCorNaRegiao(
      previa,
      x * escalaX,
      previaHeight - (y + h) * escalaY,
      w * escalaX,
      h * escalaY,
    );
    page.drawImage(cor === COR_SELO_CLARO ? seloClaro : seloVerde, {
      x,
      y,
      width: w,
      height: h,
    });
    onProgress({
      mensagem: `Carimbando página ${index + 1} de ${pages.length}...`,
      paginaAtual: index + 1,
      totalPaginas: pages.length,
    });
  }

  onProgress({ mensagem: "Salvando o PDF final..." });
  const out = await pdf.save();
  return { buffer: Buffer.from(out), tipo: TIPO_PDF, extensao: "pdf" };
}
