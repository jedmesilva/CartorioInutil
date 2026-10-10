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

async function erroDaResposta(xhr: XMLHttpRequest): Promise<Error> {
  const resposta = xhr.response as Blob | null;
  const mensagemPadrao = "Não foi possível carimbar este arquivo.";
  if (!resposta) return new Error(mensagemPadrao);

  try {
    const texto = await resposta.text();
    const payload = JSON.parse(texto) as { erro?: unknown };
    return new Error(
      typeof payload.erro === "string" ? payload.erro : mensagemPadrao,
    );
  } catch {
    return new Error(mensagemPadrao);
  }
}

export function carimbarComProgresso(
  arquivo: File,
  atualizarProgresso: CallbackProgresso,
): Promise<Blob> {
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
      falhar(
        new Error(
          "Não foi possível conectar ao acompanhamento do processamento. Tente novamente.",
        ),
      );
    }, 15000);

    eventos.onmessage = (evento) => {
      let atualizacao: CarimboProgressoEvento;
      try {
        atualizacao = JSON.parse(evento.data) as CarimboProgressoEvento;
      } catch {
        falhar(new Error("O servidor enviou uma atualização inválida."));
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
        falhar(new Error("O servidor enviou uma etapa de processamento inválida."));
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
          mensagem:
            "A conexão das atualizações foi interrompida; aguardando o arquivo final...",
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
        mensagem: "Enviando o arquivo: 0%",
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
          mensagem: `Enviando o arquivo: ${percentual}%`,
        });
      });

      xhr.upload.addEventListener("load", () => {
        envioCompleto = true;
        if (processamentoRecebido) return;
        atualizarProgresso({
          fase: "processamento",
          mensagem: "Arquivo enviado. Aguardando as etapas do servidor...",
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
        void erroDaResposta(xhr).then(falhar);
      });

      xhr.addEventListener("error", () => {
        falhar(new Error("Falha de rede durante o envio do arquivo."));
      });
      xhr.addEventListener("abort", () => {
        falhar(new Error("O envio do arquivo foi interrompido."));
      });
      xhr.send(dados);
    };
  });
}
