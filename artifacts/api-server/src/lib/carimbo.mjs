// Gerador do carimbo "Selo Oficial da Inutilidade" em SVG.
// Função pura, sem dependências: funciona no navegador e no servidor (ex.: sharp).

const FONTE = "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Texto em arco superior, letra a letra (sem <textPath>, que nem todo
// renderizador de SVG suporta, como o librsvg usado pelo sharp). Os avanços
// aproximam a largura real das maiúsculas para evitar que espaços entre palavras
// fiquem exagerados ou que o início e o fim se encostem.
function textoEmCirculo(texto, cx, cy, raio, tamanho) {
  const letras = [...texto];
  const proporcao = {
    A: 0.68, B: 0.65, C: 0.70, D: 0.72, E: 0.58, F: 0.55, G: 0.75,
    H: 0.68, I: 0.31, J: 0.52, K: 0.67, L: 0.55, M: 0.86, N: 0.70,
    O: 0.76, P: 0.61, Q: 0.76, R: 0.66, S: 0.61, T: 0.57, U: 0.69,
    V: 0.66, W: 0.94, X: 0.64, Y: 0.65, Z: 0.63,
  };
  const avancos = letras.map((ch) =>
    tamanho * (ch === " " ? 0.42 : (proporcao[ch] ?? 0.66))
  );
  const entreletra = tamanho * 0.045;
  const larguraTotal =
    avancos.reduce((total, largura) => total + largura, 0) +
    entreletra * Math.max(0, letras.length - 1);
  let cursor = -larguraTotal / 2;
  const itens = letras
    .map((ch, i) => {
      const largura = avancos[i];
      const centro = cursor + largura / 2;
      cursor += largura + (i < letras.length - 1 ? entreletra : 0);
      if (ch === " ") return "";
      const graus = (centro / raio) * (180 / Math.PI);
      return `<text x="${cx}" y="${cy - raio}" transform="rotate(${graus.toFixed(2)} ${cx} ${cy})">${esc(ch)}</text>`;
    })
    .join("");
  return `<g font-size="${tamanho}" font-weight="700" text-anchor="middle" stroke="none">${itens}</g>`;
}

export function gerarProtocolo(data = new Date()) {
  const ano = data.getFullYear();
  const num = String(Math.floor(Math.random() * 999999) + 1).padStart(6, "0");
  return `${num}/${ano}-INÚTIL`;
}

export function formatarDataHora(data = new Date()) {
  const txt = data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
  return txt.replace(", ", " às ");
}

/**
 * @param {object} [op]
 * @param {Date}   [op.data]       data/hora do carimbo
 * @param {string} [op.protocolo]  número de protocolo
 * @param {string} [op.frase]      texto sob "AUTENTICADO" (padrão: "100% inútil")
 * @param {string} [op.tabeliao]   nome do tabelião fictício
 * @param {string} [op.cor]        cor principal
 * @returns {string} SVG (fundo transparente, 640x400)
 */
export function gerarCarimboSvg(op = {}) {
  const data = op.data ?? new Date();
  const protocolo = op.protocolo ?? gerarProtocolo(data);
  const frase = op.frase ?? "100% inútil";
  const tabeliao = op.tabeliao ?? "Sr. Nada Útil";
  const cor = op.cor ?? "#0b3d2e";

  // Selo circular
  const cx = 146;
  const cy = 180;
  const textoSelo = textoEmCirculo("SELO OFICIAL DA INUTILIDADE", cx, cy, 70, 12);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img" aria-label="Selo Oficial da Inutilidade">
  <g transform="translate(0 20) rotate(-6 320 180)" fill="${cor}" stroke="${cor}" opacity="0.88" font-family="${FONTE}">

    <!-- moldura dupla -->
    <rect x="20" y="20" width="600" height="320" rx="30" fill="none" stroke-width="8" />
    <rect x="34" y="34" width="572" height="292" rx="20" fill="none" stroke-width="2" />

    <!-- selo -->
    <g>
      <circle cx="${cx}" cy="${cy}" r="88" fill="none" stroke-width="5" />
      <circle cx="${cx}" cy="${cy}" r="52" fill="none" stroke-width="2" />
      ${textoSelo}
      <text x="${cx}" y="${cy + 23}" font-size="68" font-weight="700" text-anchor="middle" stroke="none">§</text>
    </g>

    <!-- texto principal -->
    <g transform="translate(0 30)">
    <g text-anchor="middle" stroke="none">
      <text x="414" y="108" font-size="42" font-weight="800" textLength="300" lengthAdjust="spacingAndGlyphs">AUTENTICADO</text>
      <text x="414" y="142" font-size="24" font-weight="800" letter-spacing="3">${esc(frase.toUpperCase())}</text>
    </g>
    <line x1="284" y1="156" x2="544" y2="156" stroke-width="1.5" />

    <g text-anchor="middle" stroke="none">
      <text x="414" y="184" font-size="20" font-weight="800">${esc(formatarDataHora(data))}</text>
      <text x="414" y="209" font-size="15" font-weight="700">Protocolo nº ${esc(protocolo)}</text>
      <text x="414" y="232" font-size="14" font-weight="600">Tabelião: ${esc(tabeliao)}</text>
    </g>
    </g>
  </g>
</svg>`;
}

// Útil no navegador: <img src={carimboParaDataUrl(svg)} /> ou para desenhar em canvas.
export function carimboParaDataUrl(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// No servidor com sharp:
//   const png = await sharp(Buffer.from(gerarCarimboSvg())).png().toBuffer();
