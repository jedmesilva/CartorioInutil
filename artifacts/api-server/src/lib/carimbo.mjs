// Gerador do carimbo "Selo Oficial da Inutilidade" em SVG.
// Função pura, sem dependências: funciona no navegador e no servidor (ex.: sharp).

const FONTE = "'DejaVu Serif', Georgia, serif";
const COR_PAPEL = "#f4f1e3";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Texto em arco, letra a letra (sem <textPath>, que nem todo renderizador de SVG
// suporta, como o librsvg usado pelo sharp). Avanços proporcionais mantêm o
// espaçamento entre letras; os arcos superior e inferior ficam na mesma direção
// de leitura, com os glifos da parte inferior sempre em pé.
function textoEmArco(texto, cx, cy, raio, tamanho, posicao) {
  const letras = [...texto];
  const proporcao = {
    A: 0.68, B: 0.65, C: 0.70, D: 0.72, E: 0.58, F: 0.55, G: 0.75,
    H: 0.68, I: 0.31, J: 0.52, K: 0.67, L: 0.55, M: 0.86, N: 0.70,
    O: 0.76, P: 0.61, Q: 0.76, R: 0.66, S: 0.61, T: 0.57, U: 0.69,
    V: 0.66, W: 0.94, X: 0.64, Y: 0.65, Z: 0.63,
    "0": 0.68, "1": 0.40, "%": 0.88, Ú: 0.69,
  };
  const avancos = letras.map((ch) =>
    tamanho * (ch === " " ? 0.42 : (proporcao[ch] ?? 0.66))
  );
  const intervalos = Math.max(0, letras.length - 1);
  const entreletraBase = tamanho * 0.045;
  const larguraBase =
    avancos.reduce((total, largura) => total + largura, 0) +
    entreletraBase * intervalos;
  const larguraAlvo = raio * ((130 * Math.PI) / 180);
  const entreletra =
    entreletraBase +
    Math.max(0, larguraAlvo - larguraBase) / Math.max(1, intervalos);
  const larguraTotal =
    avancos.reduce((total, largura) => total + largura, 0) +
    entreletra * intervalos;
  let cursor = -larguraTotal / 2;
  const itens = letras
    .map((ch, i) => {
      const largura = avancos[i];
      const deslocamento = cursor + largura / 2;
      cursor += largura + (i < letras.length - 1 ? entreletra : 0);
      if (ch === " ") return "";
      const angulo = (deslocamento / raio) * (180 / Math.PI);
      const inferior = posicao === "inferior";
      const theta = inferior ? 180 - angulo : angulo;
      const rotacao = inferior ? -angulo : angulo;
      const x = cx + raio * Math.sin((theta * Math.PI) / 180);
      const y = cy - raio * Math.cos((theta * Math.PI) / 180);
      return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" transform="rotate(${rotacao.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})">${esc(ch)}</text>`;
    })
    .join("");
  return `<g font-size="${tamanho}" font-weight="700" text-anchor="middle" stroke="none">${itens}</g>`;
}

function gerarPontosDeDesgaste() {
  let estado = 0x4c415249;
  const pontos = [];
  for (let i = 0; i < 1700; i += 1) {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    const x = (estado / 0xffffffff) * 800;
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    const y = (estado / 0xffffffff) * 420;
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    const raio = 0.28 + (estado / 0xffffffff) * 0.98;
    pontos.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${raio.toFixed(2)}" />`);
  }
  return pontos.join("");
}

const PONTOS_DE_DESGASTE = gerarPontosDeDesgaste();

export function gerarProtocolo() {
  return String(Math.floor(Math.random() * 999999) + 1).padStart(6, "0");
}

export function formatarDataHora(data = new Date()) {
  const txt = data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
  return txt.replace(", ", " às ");
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * @param {object} [op]
 * @param {Date}   [op.data]       data/hora do carimbo
 * @param {string} [op.protocolo]  número de protocolo
 * @param {string} [op.cor]        cor principal
 * @returns {string} SVG do carimbo em 800x420
 */
export function gerarCarimboSvg(op = {}) {
  const data = op.data ?? new Date();
  const protocolo = op.protocolo ?? gerarProtocolo();
  const cor = op.cor ?? "#0b3d2e";

  // Os dois arcos mantêm os glifos em pé, como no carimbo de referência.
  const cx = 155;
  const cy = 145;
  const textoSuperior = textoEmArco("100% INÚTIL", cx, cy, 80, 17, "superior");
  const textoInferior = textoEmArco("100% INÚTIL", cx, cy, 80, 17, "inferior");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" width="800" height="420" role="img" aria-label="Carimbo autenticado do 1º cartório oficial de notas inúteis">
  <defs>
    <mask id="desgaste-tinta" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="420">
      <rect width="800" height="420" fill="white" />
      <g fill="black" stroke="none">${PONTOS_DE_DESGASTE}</g>
    </mask>
  </defs>
  <rect x="6" y="6" width="788" height="408" rx="12" fill="${COR_PAPEL}" fill-opacity="0.96" />
  <g fill="${cor}" stroke="${cor}" opacity="0.95" font-family="${FONTE}" mask="url(#desgaste-tinta)">

    <!-- Moldura principal -->
    <rect x="31" y="28" width="738" height="236" rx="22" fill="none" stroke-width="8" />
    <rect x="39" y="36" width="722" height="220" rx="16" fill="none" stroke-width="2" />

    <!-- selo -->
    <g>
      <circle cx="${cx}" cy="${cy}" r="105" fill="none" stroke-width="5" />
      <circle cx="${cx}" cy="${cy}" r="94" fill="none" stroke-width="2" />
      <circle cx="${cx}" cy="${cy}" r="61" fill="none" stroke-width="2" />
      ${textoSuperior}
      ${textoInferior}
      <circle cx="${cx - 82}" cy="${cy}" r="4" stroke="none" />
      <circle cx="${cx + 82}" cy="${cy}" r="4" stroke="none" />
      <text x="${cx}" y="${cy + 24}" font-size="78" font-weight="700" text-anchor="middle" stroke="none">§</text>
    </g>

    <!-- Separador e identificação do cartório -->
    <line x1="281" y1="47" x2="281" y2="245" stroke-width="6" stroke-linecap="round" />
    <text x="525" y="121" font-size="51" font-weight="700" text-anchor="middle" stroke="none">AUTENTICADO</text>
    <line x1="301" y1="151" x2="748" y2="151" stroke-width="6" stroke-linecap="round" />
    <text x="525" y="190" font-size="27" font-weight="700" text-anchor="middle" stroke="none">1º cartório oficial de</text>
    <text x="525" y="222" font-size="27" font-weight="700" text-anchor="middle" stroke="none">notas inúteis</text>

    <!-- Campos de data e protocolo -->
    <text x="77" y="307" font-size="27" font-weight="700" stroke="none">DATA:</text>
    <text x="455" y="307" font-size="28" font-weight="700" text-anchor="middle" stroke="none">${esc(formatarData(data))}</text>
    <line x1="205" y1="313" x2="744" y2="313" stroke-width="3" />
    <text x="77" y="376" font-size="26" font-weight="700" stroke="none">PROTOCOLO Nº:</text>
    <text x="480" y="376" font-size="29" font-weight="700" letter-spacing="5" text-anchor="middle" stroke="none">${esc(protocolo)}</text>
    <line x1="341" y1="382" x2="744" y2="382" stroke-width="3" />
  </g>
</svg>`;
}

// Útil no navegador: <img src={carimboParaDataUrl(svg)} /> ou para desenhar em canvas.
export function carimboParaDataUrl(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// No servidor com sharp:
//   const png = await sharp(Buffer.from(gerarCarimboSvg())).png().toBuffer();
