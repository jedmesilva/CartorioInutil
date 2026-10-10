import {
  carimbarImagem,
  carimbarPdf,
  ErroDeArquivo,
  TIPOS_IMAGEM,
  TIPO_PDF,
} from "../../../lib/carimbar.mjs";

export const runtime = "nodejs"; // sharp não roda no Edge Runtime
export const dynamic = "force-dynamic";

const TAMANHO_MAXIMO = 15 * 1024 * 1024; // 15 MB

const erro = (mensagem, status) =>
  Response.json({ erro: mensagem }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return erro("Envio inválido.", 400);
  }

  const arquivo = form.get("arquivo");
  if (!arquivo || typeof arquivo === "string") return erro("Nenhum arquivo enviado.", 400);
  if (arquivo.size === 0) return erro("O arquivo está vazio.", 400);
  if (arquivo.size > TAMANHO_MAXIMO) return erro("Arquivo grande demais (máximo de 15 MB).", 413);

  const ehPdf = arquivo.type === TIPO_PDF || /\.pdf$/i.test(arquivo.name || "");
  const ehImagem = TIPOS_IMAGEM.includes(arquivo.type);
  if (!ehPdf && !ehImagem) return erro("Formato não suportado. Envie uma imagem (JPG, PNG ou WEBP) ou um PDF.", 415);

  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const resultado = ehPdf ? await carimbarPdf(buffer) : await carimbarImagem(buffer, arquivo.type);

    const base = (arquivo.name || "arquivo").replace(/\.[^.]+$/, "");
    const nome = `${base}-carimbado.${resultado.extensao}`;

    return new Response(new Uint8Array(resultado.buffer), {
      headers: {
        "Content-Type": resultado.tipo,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nome)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof ErroDeArquivo) return erro(e.message, e.status);
    console.error("Erro ao carimbar:", e);
    return erro("Não foi possível carimbar este arquivo.", 500);
  }
}
