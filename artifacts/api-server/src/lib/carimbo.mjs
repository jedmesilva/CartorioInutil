// Port da arte de referência anexada pelo usuário, com data e protocolo dinâmicos.
// Função pura, sem dependências: funciona no servidor (ex.: sharp).

const FONTE = "'DejaVu Serif', Georgia, 'Times New Roman', serif";
const FONTE_NUMERICA = "'DejaVu Sans Mono', 'Courier New', Courier, monospace";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Renderiza o texto nos arcos sem <textPath>, que o librsvg do sharp não desenha
// de forma consistente. As posições seguem os dois caminhos da arte fornecida.
function textoEmArco(texto, cx, cy, raio, tamanho, entreletra, posicao) {
  const letras = [...texto];
  const proporcao = {
    A: 0.72, B: 0.67, C: 0.67, D: 0.72, E: 0.61, F: 0.56, G: 0.72,
    H: 0.72, I: 0.33, J: 0.39, K: 0.72, L: 0.61, M: 0.89, N: 0.72,
    O: 0.78, P: 0.61, Q: 0.78, R: 0.67, S: 0.56, T: 0.61, U: 0.72,
    V: 0.72, W: 0.94, X: 0.72, Y: 0.72, Z: 0.61,
    "0": 0.64, "1": 0.64, "%": 0.98, Ú: 0.72,
  };
  const avancos = letras.map((ch) => tamanho * (ch === " " ? 0.42 : (proporcao[ch] ?? 0.66)));
  const larguraTotal = avancos.reduce((total, largura) => total + largura, 0) +
    entreletra * Math.max(0, letras.length - 1);
  let cursor = -larguraTotal / 2;
  const itens = letras
    .map((ch, i) => {
      const largura = avancos[i];
      const deslocamento = cursor + largura / 2;
      cursor += largura + entreletra;
      if (ch === " ") return "";
      const angulo = (deslocamento / raio) * (180 / Math.PI);
      const inferior = posicao === "inferior";
      const x = cx + raio * Math.sin((angulo * Math.PI) / 180);
      const y = cy + (inferior ? 1 : -1) * raio * Math.cos((angulo * Math.PI) / 180);
      const rotacao = inferior ? -angulo : angulo;
      return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" transform="rotate(${rotacao.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})">${esc(ch)}</text>`;
    })
    .join("");
  return `<g font-family="${FONTE}" font-size="${tamanho}" font-weight="700" text-anchor="middle" stroke="none">${itens}</g>`;
}

function escalaHorizontal(ancora, escala) {
  return `translate(${ancora} 0) scale(${escala.toFixed(4)} 1) translate(${-ancora} 0)`;
}

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
 * @param {Date}   [op.data]       data do carimbo
 * @param {string} [op.protocolo]  número de protocolo
 * @param {string} [op.cor]        cor principal
 * @param {string} [op.fundo]      cor opcional de fundo; transparente por padrão
 * @returns {string} SVG do carimbo em 1080x688
 */
export function gerarCarimboSvg(op = {}) {
  const data = op.data ?? new Date();
  const protocolo = op.protocolo ?? gerarProtocolo();
  const cor = op.cor ?? "#0f4c2d";
  const fundo = op.fundo ?? "transparent";
  const semFundo = /^(none|transparent|transparente)$/i.test(fundo);
  const cx = 225;
  const cy = 270;
  const textoSuperior = textoEmArco("100% INÚTIL", cx, cy, 94, 30, 1.2, "superior");
  const textoInferior = textoEmArco("100% INÚTIL", cx, cy, 118, 30, 3.2, "inferior");
  const corSvg = esc(cor);
  const fundoSvg = semFundo ? "" : `<rect width="1080" height="688" fill="${esc(fundo)}"/>`;
  const dataTexto = formatarData(data);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="688" viewBox="0 0 1080 688" role="img" aria-label="Autenticado, 1º cartório oficial de notas inúteis. Data ${esc(dataTexto)}. Protocolo ${esc(protocolo)}.">
<defs>
<filter id="cn-r" filterUnits="userSpaceOnUse" x="0" y="0" width="1080" height="688" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="a"/>
<feDisplacementMap in="SourceGraphic" in2="a" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/>
<feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="11" result="b"/>
<feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  11 0 0 0 -3.6" result="m"/>
<feComposite in="d" in2="m" operator="in"/>
</filter>
</defs>
${fundoSvg}
<g filter="url(#cn-r)">
<g fill="none" stroke="${corSvg}" stroke-linecap="round">
<rect x="67" y="113" width="949" height="313" rx="42" stroke-width="9"/>
<circle cx="225" cy="270" r="134" stroke-width="8"/>
<circle cx="225" cy="270" r="78" stroke-width="4.5"/>
<path d="M372 138V405" stroke-width="4.5"/>
<path d="M400 282H982" stroke-width="6"/>
<path d="M282 511H940M468 585H940" stroke-width="3"/>
</g>
<g fill="${corSvg}" font-family="${FONTE}" font-weight="700" style="font-variant-numeric:lining-nums">
<circle cx="122" cy="270" r="5"/>
<circle cx="328" cy="270" r="5"/>
${textoSuperior}
${textoInferior}
<text x="225" y="307" font-size="128" font-weight="900" text-anchor="middle">§</text>
<text x="400" y="247" font-size="109" font-weight="900" transform="${esc(escalaHorizontal(400, 585 / 933))}">AUTENTICADO</text>
<text x="440" y="340" font-size="46" transform="${esc(escalaHorizontal(440, 507 / 525))}">1º cartório oficial de</text>
<text x="540" y="390" font-size="46" transform="${esc(escalaHorizontal(540, 318 / 333))}">notas inúteis</text>
<text x="137" y="505" font-size="35" font-weight="900" transform="${esc(escalaHorizontal(137, 125 / 116))}">DATA:</text>
<text x="137" y="578" font-size="35" font-weight="900" transform="${esc(escalaHorizontal(137, 315 / 327))}">PROTOCOLO Nº:</text>
</g>
<g fill="${corSvg}" font-family="${FONTE_NUMERICA}" font-size="42" letter-spacing="2">
<text x="375" y="500">${esc(dataTexto)}</text>
<text x="522" y="575">${esc(protocolo)}</text>
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
