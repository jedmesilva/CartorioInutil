"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCarimbarArquivo } from "@workspace/api-client-react";

const C = {
  bg: "#f4f4f0",
  dark: "#0b3d2e",
  title: "#0a2e24",
  muted: "#6b8279",
  border: "#d9ddd6",
  card: "#f7f7f4",
  circle: "#dfe6df",
};

// Borda serrilhada do selo (logo)
const MARCA_SELO =
  "M32.00 1.00L35.16 3.98L38.90 1.78L41.31 5.38L45.45 4.07L47.00 8.12L51.33 7.76L51.94 12.06L56.24 12.67L55.88 17.00L59.93 18.55L58.62 22.69L62.22 25.10L60.02 28.84L63.00 32.00L60.02 35.16L62.22 38.90L58.62 41.31L59.93 45.45L55.88 47.00L56.24 51.33L51.94 51.94L51.33 56.24L47.00 55.88L45.45 59.93L41.31 58.62L38.90 62.22L35.16 60.02L32.00 63.00L28.84 60.02L25.10 62.22L22.69 58.62L18.55 59.93L17.00 55.88L12.67 56.24L12.06 51.94L7.76 51.33L8.12 47.00L4.07 45.45L5.38 41.31L1.78 38.90L3.98 35.16L1.00 32.00L3.98 28.84L1.78 25.10L5.38 22.69L4.07 18.55L8.12 17.00L7.76 12.67L12.06 12.06L12.67 7.76L17.00 8.12L18.55 4.07L22.69 5.38L25.10 1.78L28.84 3.98Z";

const Icon = ({ children, size = 24, stroke = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={C.dark}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const icons = {
  upload: (
    <Icon size={52} stroke={1.7}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 17v-6" />
      <path d="m9.5 13 2.5-2.5 2.5 2.5" />
    </Icon>
  ),
  image: (
    <Icon size={34}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="1.6" />
      <path d="m21 16-5-5-9 9" />
    </Icon>
  ),
  file: (
    <Icon size={34}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </Icon>
  ),
  promessa: (
    <Icon size={30}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h6" />
    </Icon>
  ),
  declaracao: (
    <Icon size={30}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </Icon>
  ),
  acordo: (
    <Icon size={32}>
      <path d="m11 17 2 2a1.4 1.4 0 0 0 2-2" />
      <path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2l-3.4-3.4a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2 0 1.4 1.4 0 0 1 0-2L12 7.5a4 4 0 0 1 3-.5l2.5.6" />
      <path d="m2 12 4-4 4 1" />
      <path d="M22 12l-3-3" />
      <path d="m8 18 1.5 1.5a1.4 1.4 0 0 0 2-2" />
      <path d="m6 16 2 2a1.4 1.4 0 0 0 2-2" />
    </Icon>
  ),
  reconhecimento: (
    <Icon size={30}>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </Icon>
  ),
  plano: (
    <Icon size={30}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2.4" />
    </Icon>
  ),
  outra: (
    <Icon size={30}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8" />
      <path d="M12 16.5h.01" strokeWidth="2.4" />
    </Icon>
  ),
  chevron: (
    <Icon size={20} stroke={2.2}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  ),
};

const servicos = [
  { id: "promessa", titulo: "Promessa", desc: "Registre o que você pretende fazer." },
  { id: "declaracao", titulo: "Declaração", desc: "Declare qualquer coisa, por mais absurda que seja." },
  { id: "acordo", titulo: "Acordo", desc: "Formalize um compromisso entre você e outra pessoa." },
  { id: "reconhecimento", titulo: "Reconhecimento", desc: "Reconheça um fato absolutamente inútil." },
  { id: "plano", titulo: "Plano de vida", desc: "Registre aquela mudança que começa na segunda." },
  { id: "outra", titulo: "Outra certidão", desc: "Porque a burocracia não pode limitar sua criatividade." },
];

/* ---------- Tela ---------- */

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 15 * 1024 * 1024; // mesmo limite do servidor

export default function AutentiqueTela({ onSelectFile, onSelectServico }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [avisoCompartilhamento, setAvisoCompartilhamento] = useState("");
  const carimbar = useCarimbarArquivo();

  // libera a URL temporária do resultado anterior
  useEffect(() => {
    return () => {
      if (resultado?.url) URL.revokeObjectURL(resultado.url);
    };
  }, [resultado]);

  const handleFile = async (file) => {
    if (!file) return;
    setErro(null);
    setResultado(null);
    setAvisoCompartilhamento("");

    const ehPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const ehImagem = TIPOS_IMAGEM.includes(file.type);
    if (!ehPdf && !ehImagem) {
      setArquivo(null);
      setErro("Formato não suportado. Envie uma imagem (JPG, PNG ou WEBP) ou um PDF.");
      return;
    }
    if (file.size > TAMANHO_MAXIMO) {
      setArquivo(null);
      setErro("Arquivo grande demais (máximo de 15 MB).");
      return;
    }

    setArquivo(file);
    onSelectFile?.(file);
    setProcessando(true);
    try {
      const blob = await carimbar.mutateAsync({ data: { arquivo: file } });
      const ext = blob.type === "application/pdf" ? "pdf" : blob.type === "image/jpeg" ? "jpg" : "png";
      const base = file.name.replace(/\.[^.]+$/, "");
      setResultado({
        url: URL.createObjectURL(blob),
        nome: `${base}-carimbado.${ext}`,
        imagem: blob.type.startsWith("image/"),
        blob,
      });
    } catch (e) {
      console.error(e);
      const mensagemApi = e?.data?.erro;
      setErro(mensagemApi || e.message || "Não foi possível carimbar este arquivo.");
    } finally {
      setProcessando(false);
    }
  };

  const compartilharArquivo = async () => {
    if (!resultado) return;

    const arquivoCompartilhado = new File([resultado.blob], resultado.nome, {
      type: resultado.blob.type || "application/octet-stream",
    });

    if (
      typeof navigator.share !== "function" ||
      (navigator.canShare && !navigator.canShare({ files: [arquivoCompartilhado] }))
    ) {
      setAvisoCompartilhamento(
        "Este navegador não compartilha arquivos diretamente. Baixe o documento e envie pelo aplicativo que preferir."
      );
      return;
    }

    try {
      await navigator.share({
        title: "Documento carimbado — Cartório de Notas Inúteis",
        files: [arquivoCompartilhado],
      });
      setAvisoCompartilhamento("Documento compartilhado. A validade jurídica continua exatamente a mesma: nenhuma.");
    } catch (e) {
      if (e?.name !== "AbortError") {
        setAvisoCompartilhamento("Não foi possível compartilhar agora. Você ainda pode baixar o arquivo carimbado.");
      }
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .aut-btn { transition: transform .15s ease, filter .15s ease; }
        .aut-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .aut-btn:active { transform: translateY(0) scale(.99); }
        .aut-card { transition: box-shadow .15s ease, transform .15s ease, border-color .15s ease; }
        .aut-card:hover { box-shadow: 0 6px 18px rgba(11,61,46,.10); transform: translateY(-1px); border-color: #c3cbc2; }
        .aut-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        @media (max-width: 520px) {
          .aut-grid { grid-template-columns: 1fr; gap: 12px; }
          .aut-card { padding: 16px 14px !important; }
          .aut-h1 { font-size: 44px !important; }
        }
      `}</style>

      <div style={styles.container}>
        <header style={styles.logo} aria-label="1° Cartório de Notas Inúteis">
          <svg width="46" height="46" viewBox="0 0 64 64" aria-hidden="true">
            <path d={MARCA_SELO} fill={C.dark} stroke={C.dark} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="32" cy="32" r="23.5" fill="none" stroke="#f4f4f0" strokeWidth="1.6" />
            <text x="32" y="43" fontSize="32" fontWeight="800" textAnchor="middle" fill="#f4f4f0" style={{ fontFamily: "inherit" }}>
              §
            </text>
          </svg>
          <div style={styles.logoText}>
            <span style={styles.logoSmall}>1° CARTÓRIO DE</span>
            <span style={styles.logoBig}>Notas Inúteis</span>
          </div>
        </header>

        <h1 className="aut-h1" style={styles.h1}>
          Autentique
          <br />
          qualquer coisa.
        </h1>
        <p style={styles.sub}>
          Envie uma imagem ou documento e receba seu carimbo oficial de inutilidade.
        </p>

        <div
          style={{
            ...styles.drop,
            background: drag ? "#e8ece6" : "#eeefea",
            borderColor: drag ? C.dark : "#b9c0b8",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {icons.upload}
          <button
            className="aut-btn"
            style={styles.btn}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Selecionar arquivo
          </button>
          <p style={styles.hint}>
            {arquivo ? `Selecionado: ${arquivo.name}` : "Arraste e solte aqui ou clique para enviar."}
          </p>

          <div style={styles.tipos}>
            <div style={styles.tipo}>
              {icons.image}
              <div>
                <div style={styles.tipoT}>Imagens</div>
                <div style={styles.tipoD}>JPG, PNG ou WEBP</div>
              </div>
            </div>
            <div style={styles.divisor} />
            <div style={styles.tipo}>
              {icons.file}
              <div>
                <div style={styles.tipoT}>Documentos</div>
                <div style={styles.tipoD}>Somente PDF</div>
              </div>
            </div>
          </div>
        </div>

        {(processando || resultado || erro) && (
          <div style={styles.resultado}>
            {processando && <p style={styles.resTxt}>Carimbando seu arquivo…</p>}
            {erro && <p style={{ ...styles.resTxt, color: "#9a3b2e" }}>{erro}</p>}
            {resultado && (
              <>
                {resultado.imagem && (
                  <img src={resultado.url} alt="Prévia do arquivo carimbado" style={styles.resImg} />
                )}
                <p style={styles.resTxt}>Pronto! Seu arquivo foi oficialmente carimbado como inútil.</p>
                <a className="aut-btn" href={resultado.url} download={resultado.nome} style={styles.resBtn}>
                  Baixar arquivo carimbado
                </a>
                <button
                  className="aut-btn"
                  type="button"
                  onClick={compartilharArquivo}
                  style={{
                    ...styles.resBtn,
                    width: "100%",
                    border: "none",
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  Compartilhar arquivo
                </button>
                {avisoCompartilhamento && (
                  <p role="status" style={styles.resTxt}>{avisoCompartilhamento}</p>
                )}
              </>
            )}
          </div>
        )}

        <div style={styles.eyebrow}>OUTROS SERVIÇOS</div>
        <h2 style={styles.h2}>Precisa de uma certidão?</h2>
        <p style={styles.sub2}>
          Você também pode emitir certidões inúteis para o que desejar.
        </p>

        <div className="aut-grid">
          {servicos.map((s) => (
            <button
              key={s.id}
              className="aut-card"
              style={styles.card}
              onClick={() => onSelectServico?.(s.id)}
            >
              <div style={styles.circle}>{icons[s.id]}</div>
              <div style={styles.cardText}>
                <div style={styles.cardT}>{s.titulo}</div>
                <div style={styles.cardD}>{s.desc}</div>
              </div>
              {icons.chevron}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: C.bg,
    minHeight: "100vh",
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    color: C.title,
    display: "flex",
    justifyContent: "center",
  },
  container: { width: "100%", maxWidth: 560, padding: "28px 18px 40px" },
  logo: { display: "flex", alignItems: "center", gap: 14, marginBottom: 36 },
  logoText: { display: "flex", flexDirection: "column", lineHeight: 1 },
  logoSmall: { fontSize: 11, fontWeight: 700, letterSpacing: "0.28em", color: C.muted },
  logoBig: { fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", color: C.title, marginTop: 4 },
  h1: {
    fontSize: 56,
    lineHeight: 1.0,
    fontWeight: 800,
    letterSpacing: "-0.035em",
    margin: 0,
    color: C.title,
  },
  sub: { fontSize: 18, lineHeight: 1.45, color: C.muted, margin: "22px 0 30px", maxWidth: 440, textWrap: "balance" },
  drop: {
    border: "1.5px dashed #b9c0b8",
    borderRadius: 18,
    padding: "34px 16px 28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    transition: "background .15s, border-color .15s",
  },
  btn: {
    marginTop: 22,
    background: C.dark,
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "20px 0",
    width: "100%",
    maxWidth: 400,
    fontSize: 19,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  hint: { fontSize: 15, color: C.muted, margin: "18px 0 28px", textAlign: "center" },
  tipos: { display: "flex", alignItems: "center", justifyContent: "center", gap: 28, flexWrap: "wrap" },
  tipo: { display: "flex", alignItems: "center", gap: 12 },
  tipoT: { fontSize: 15, fontWeight: 600, color: C.title },
  tipoD: { fontSize: 13, color: C.muted, marginTop: 2 },
  divisor: { width: 1, height: 44, background: "#c9cfc8" },
  resultado: {
    marginTop: 20,
    padding: 18,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
  },
  resImg: { maxWidth: "100%", maxHeight: 320, borderRadius: 10, objectFit: "contain" },
  resTxt: { margin: 0, fontSize: 15, color: C.muted, textAlign: "center" },
  resBtn: {
    background: C.dark,
    color: "#fff",
    textDecoration: "none",
    borderRadius: 999,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 600,
    textAlign: "center",
  },
  eyebrow: {
    marginTop: 40,
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: "0.3em",
    color: C.dark,
  },
  h2: { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "10px 0 8px" },
  sub2: { fontSize: 16.5, lineHeight: 1.45, color: C.muted, margin: "0 0 22px", maxWidth: 480, textWrap: "balance" },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "18px 12px",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
    color: C.title,
  },
  circle: {
    flexShrink: 0,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: C.circle,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, minWidth: 0 },
  cardT: { fontSize: 15, fontWeight: 600, color: C.title },
  cardD: { fontSize: 13, lineHeight: 1.4, color: C.muted, marginTop: 4 },
};
