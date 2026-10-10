import { Router, type IRouter, type RequestHandler } from "express";
import multer from "multer";
import type { CarimboErro } from "@workspace/api-zod";
import {
  carimbarImagem,
  carimbarPdf,
  ErroDeArquivo,
  TIPOS_IMAGEM,
  TIPO_PDF,
} from "../lib/carimbar.mjs";
import {
  enviarProgressoCarimbo,
  idProgressoValido,
  inscreverProgressoCarimbo,
} from "../lib/carimbo-progresso";

const router: IRouter = Router();
const LIMITE_ARQUIVO = 15 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_ARQUIVO, files: 1 },
});

const responderErro = (
  res: Parameters<RequestHandler>[1],
  status: number,
  mensagem: string,
): void => {
  const erro: CarimboErro = { erro: mensagem };
  res.status(status).json(erro);
};

router.get("/carimbar/progresso/:progressId", (req, res): void => {
  const rawId = req.params.progressId;
  const progressId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!idProgressoValido(progressId)) {
    responderErro(res, 400, "Identificador de progresso inválido.");
    return;
  }
  inscreverProgressoCarimbo(progressId, res);
});

const uploadArquivo: RequestHandler = (req, res, next) => {
  const progressId = req.get("X-Progress-ID");
  if (progressId && !idProgressoValido(progressId)) {
    responderErro(res, 400, "Identificador de progresso inválido.");
    return;
  }

  upload.single("arquivo")(req, res, (error?: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      responderErro(res, 413, "Arquivo grande demais (máximo de 15 MB).");
      return;
    }

    req.log.warn({ err: error }, "Upload inválido");
    responderErro(res, 400, "Envio inválido. Tente selecionar o arquivo novamente.");
  });
};

router.post("/carimbar", uploadArquivo, async (req, res): Promise<void> => {
  const progressId = req.get("X-Progress-ID");
  if (progressId && !idProgressoValido(progressId)) {
    responderErro(res, 400, "Identificador de progresso inválido.");
    return;
  }

  const arquivo = req.file;
  if (!arquivo) {
    responderErro(res, 400, "Nenhum arquivo enviado.");
    return;
  }

  if (arquivo.size === 0) {
    responderErro(res, 400, "O arquivo está vazio.");
    return;
  }

  const ehPdf = arquivo.mimetype === TIPO_PDF || /\.pdf$/i.test(arquivo.originalname);
  const extensao = arquivo.originalname.split(/[\\/]/).pop()?.toLowerCase().match(/\.([^.]+)$/)?.[1];
  const imagemPorExtensao: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const tipoImagem = TIPOS_IMAGEM.includes(arquivo.mimetype)
    ? arquivo.mimetype
    : extensao
      ? imagemPorExtensao[extensao]
      : undefined;

  if (!ehPdf && !tipoImagem) {
    responderErro(
      res,
      415,
      "Formato não suportado. Envie uma imagem (JPG, PNG ou WEBP) ou um PDF.",
    );
    return;
  }

  try {
    const onProgress = progressId
      ? ({ mensagem, paginaAtual, totalPaginas }: {
          mensagem: string;
          paginaAtual?: number;
          totalPaginas?: number;
        }) => {
          enviarProgressoCarimbo(progressId, {
            fase: "processando",
            mensagem,
            paginaAtual,
            totalPaginas,
          });
        }
      : undefined;
    const resultado = ehPdf
      ? await carimbarPdf(arquivo.buffer, onProgress)
      : await carimbarImagem(arquivo.buffer, tipoImagem!, onProgress);
    const base = arquivo.originalname
      .split(/[\\/]/)
      .pop()
      ?.replace(/\.[^.]+$/, "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim();
    const nome = `${base || "arquivo"}-carimbado.${resultado.extensao}`;
    const nomeFallback = nome.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");

    res.setHeader("Content-Type", resultado.tipo);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nomeFallback}"; filename*=UTF-8''${encodeURIComponent(nome)}`,
    );
    res.setHeader("Cache-Control", "no-store");
    if (progressId) {
      enviarProgressoCarimbo(progressId, {
        fase: "concluido",
        mensagem: "Arquivo pronto.",
      });
    }
    res.status(200).send(resultado.buffer);
  } catch (error) {
    if (error instanceof ErroDeArquivo) {
      if (progressId) {
        enviarProgressoCarimbo(progressId, {
          fase: "erro",
          mensagem: error.message,
        });
      }
      responderErro(res, error.status, error.message);
      return;
    }

    req.log.error({ err: error }, "Erro ao carimbar arquivo");
    if (progressId) {
      enviarProgressoCarimbo(progressId, {
        fase: "erro",
        mensagem: "Não foi possível carimbar este arquivo.",
      });
    }
    responderErro(res, 500, "Não foi possível carimbar este arquivo.");
  }
});

export default router;
