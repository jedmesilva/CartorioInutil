import {
  getAcompanharProgressoCarimboUrl,
  getCarimbarArquivoUrl,
  type CarimboProgressoEvento,
} from "@workspace/api-client-react";

export type ProgressoAutenticacao =
  | {
      fase: "conectando";
      mensagem: string;
    }
  | {
      fase: "envio";
      percentual: number;
      mensagem: string;
    }
  | {
      fase: "processamento";
      mensagem: string;
    };

type CallbackProgresso = (progresso: ProgressoAutenticacao) => void;

export function carimbarComProgresso(
  arquivo: File,
  atualizarProgresso: CallbackProgresso,
): Promise<Blob> {
  const ehPdf =
    arquivo.type === "application/pdf" || /\.pdf$/i.test(arquivo.name);
  const tipoArquivo = ehPdf ? "PDF" : "imagem";
  const artigoArquivo = ehPdf ? "do PDF" : "da imagem";
  const mensagemFalha = `Não foi possível autenticar ${ehPdf ? "o PDF" : "a imagem"}. Tente novamente.`;
  const idProgresso = crypto.randomUUID();
  const urlBase = getCarimbarArquivoUrl();
  const urlProgresso = getAcompanharProgressoCarimboUrl(idProgresso);
  const urlEnvio = urlBase;

  return new Promise((resolve, reject) => {
    const eventos = new EventSource(urlProgresso);
    const xhr = new XMLHttpRequest();
    let finalizado = false;
    let envioIniciado = false;
    let envioCompleto = false;
    let processamentoRecebido = false;
    let avisoConexaoMostrado = false;

    const limpar = () => {
      window.clearTimeout(tempoLimiteConexao);
      eventos.close();
    };
    const falhar = (erro: Error) => {
      if (finalizado) return;
      finalizado = true;
      limpar();
      if (envioIniciado && xhr.readyState !== XMLHttpRequest.DONE) xhr.abort();
      reject(erro);
    };

    const tempoLimiteConexao = window.setTimeout(() => {
      falhar(new Error(mensagemFalha));
    }, 15000);

    eventos.onmessage = (evento) => {
      let atualizacao: CarimboProgressoEvento;
      try {
        atualizacao = JSON.parse(evento.data) as CarimboProgressoEvento;
      } catch {
        falhar(new Error(mensagemFalha));
        return;
      }

      if (
        atualizacao.fase === "processando" &&
        typeof atualizacao.mensagem === "string"
      ) {
        processamentoRecebido = true;
        atualizarProgresso({
          fase: "processamento",
          mensagem: atualizacao.mensagem,
        });
      } else if (atualizacao.fase === "concluido" || atualizacao.fase === "erro") {
        eventos.close();
      } else {
        falhar(new Error(mensagemFalha));
      }
    };

    eventos.onerror = () => {
      if (
        envioCompleto &&
        !processamentoRecebido &&
        !avisoConexaoMostrado &&
        !finalizado
      ) {
        avisoConexaoMostrado = true;
        atualizarProgresso({
          fase: "processamento",
          mensagem: `Aguardando o resultado da autenticação ${artigoArquivo}...`,
        });
      }
    };

    eventos.onopen = () => {
      if (finalizado || envioIniciado) return;
      envioIniciado = true;
      window.clearTimeout(tempoLimiteConexao);
      atualizarProgresso({
        fase: "envio",
        percentual: 0,
        mensagem: `Enviando ${tipoArquivo}: 0%`,
      });

      const dados = new FormData();
      dados.append("arquivo", arquivo);
      xhr.open("POST", urlEnvio);
      xhr.responseType = "blob";
      xhr.setRequestHeader("X-Progress-ID", idProgresso);

      xhr.upload.addEventListener("progress", (progresso) => {
        if (!progresso.lengthComputable || processamentoRecebido) return;
        const percentual = Math.min(
          100,
          Math.round((progresso.loaded / progresso.total) * 100),
        );
        atualizarProgresso({
          fase: "envio",
          percentual,
          mensagem: `Enviando ${tipoArquivo}: ${percentual}%`,
        });
      });

      xhr.upload.addEventListener("load", () => {
        envioCompleto = true;
        if (processamentoRecebido) return;
        atualizarProgresso({
          fase: "processamento",
          mensagem: `Aguardando o processamento ${artigoArquivo}...`,
        });
      });

      xhr.addEventListener("load", () => {
        if (finalizado) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          finalizado = true;
          limpar();
          resolve(xhr.response as Blob);
          return;
        }
        falhar(new Error(mensagemFalha));
      });

      xhr.addEventListener("error", () => {
        falhar(new Error(mensagemFalha));
      });
      xhr.addEventListener("abort", () => {
        falhar(new Error(mensagemFalha));
      });
      xhr.send(dados);
    };
  });
}
