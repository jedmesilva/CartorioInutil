import type { Response } from "express";

export type CarimboProgressoEvento = {
  fase: "processando" | "concluido" | "erro";
  mensagem: string;
  paginaAtual?: number;
  totalPaginas?: number;
};

type CanalProgresso = {
  clientes: Set<Response>;
  ultimoEvento?: CarimboProgressoEvento;
  timerLimpeza?: ReturnType<typeof setTimeout>;
};

const canais = new Map<string, CanalProgresso>();
const TEMPO_RETENCAO_MS = 5 * 60 * 1000;
const INTERVALO_PING_MS = 15 * 1000;
const ID_PROGRESSO_REGEX =
  /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

export function idProgressoValido(id: string): boolean {
  return ID_PROGRESSO_REGEX.test(id);
}

function obterCanal(id: string): CanalProgresso {
  let canal = canais.get(id);
  if (!canal) {
    canal = { clientes: new Set() };
    canais.set(id, canal);
  }
  return canal;
}

function escreverEvento(
  resposta: Response,
  evento: CarimboProgressoEvento,
): void {
  if (!resposta.writableEnded && !resposta.destroyed) {
    resposta.write(`data: ${JSON.stringify(evento)}\n\n`);
  }
}

function agendarLimpeza(id: string, canal: CanalProgresso): void {
  if (canal.timerLimpeza) clearTimeout(canal.timerLimpeza);
  if (canal.clientes.size > 0) return;

  canal.timerLimpeza = setTimeout(() => {
    if (canal.clientes.size === 0 && canais.get(id) === canal) {
      canais.delete(id);
    }
  }, TEMPO_RETENCAO_MS);
  canal.timerLimpeza.unref?.();
}

export function enviarProgressoCarimbo(
  id: string,
  evento: CarimboProgressoEvento,
): void {
  const canal = canais.get(id);
  if (!canal) return;

  canal.ultimoEvento = evento;
  for (const cliente of canal.clientes) {
    escreverEvento(cliente, evento);
  }
  agendarLimpeza(id, canal);
}

export function inscreverProgressoCarimbo(
  id: string,
  resposta: Response,
): void {
  const canal = obterCanal(id);
  if (canal.timerLimpeza) {
    clearTimeout(canal.timerLimpeza);
    canal.timerLimpeza = undefined;
  }

  resposta.status(200);
  resposta.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  });
  resposta.flushHeaders();
  resposta.write("retry: 2000\n\n");
  canal.clientes.add(resposta);
  if (canal.ultimoEvento) escreverEvento(resposta, canal.ultimoEvento);

  const heartbeat = setInterval(() => {
    if (!resposta.writableEnded && !resposta.destroyed) {
      resposta.write(": keep-alive\n\n");
    }
  }, INTERVALO_PING_MS);
  heartbeat.unref?.();

  resposta.on("close", () => {
    clearInterval(heartbeat);
    canal.clientes.delete(resposta);
    agendarLimpeza(id, canal);
  });
}
