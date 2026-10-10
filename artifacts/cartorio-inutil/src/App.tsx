import { useEffect, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCarimbarArquivo } from '@workspace/api-client-react';
import { ArrowDownToLine, ArrowRight, Check, FileImage, FileText, LoaderCircle, RotateCcw, Share2, ShieldAlert, UploadCloud, X } from 'lucide-react';

const queryClient = new QueryClient();
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = /\.(pdf|jpe?g|png|webp)$/i;

type OutputFile = { blob: Blob; url: string; filename: string; isImage: boolean };

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function outputExtension(type: string, sourceName: string) {
  const known: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  if (known[type]) return known[type];
  return sourceName.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? 'bin';
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'erro' in data && typeof data.erro === 'string') {
      return data.erro;
    }
  }
  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message) as { erro?: string; message?: string };
      return parsed.erro || parsed.message || error.message;
    } catch {
      return error.message;
    }
  }
  return 'Não foi possível carimbar este arquivo agora. Tente novamente.';
}

function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState<OutputFile | null>(null);
  const [shareNotice, setShareNotice] = useState('');
  const carimbar = useCarimbarArquivo();

  useEffect(() => {
    return () => {
      if (output?.url) URL.revokeObjectURL(output.url);
    };
  }, [output]);

  const chooseFile = (candidate?: File) => {
    if (!candidate) return;
    setError('');
    setShareNotice('');
    setOutput(null);
    const validType = ACCEPTED_TYPES.includes(candidate.type) || ACCEPTED_EXTENSIONS.test(candidate.name);
    if (!validType) {
      setFile(null);
      setError('Esse documento não consta nos nossos registros. Envie PDF, JPG, PNG ou WEBP.');
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFile(null);
      setError('Arquivo acima do limite cartorial imaginário de 15 MB.');
      return;
    }
    setFile(candidate);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const submit = async () => {
    if (!file || carimbar.isPending) return;
    setError('');
    setShareNotice('');
    setOutput(null);
    try {
      const blob = await carimbar.mutateAsync({ data: { arquivo: file } });
      const ext = outputExtension(blob.type, file.name);
      const base = file.name.replace(/\.[^.]+$/, '') || 'documento';
      const namedBlob = blob.type ? blob : new Blob([blob], { type: 'application/octet-stream' });
      setOutput({
        blob: namedBlob,
        url: URL.createObjectURL(namedBlob),
        filename: `${base}-carimbado.${ext}`,
        isImage: blob.type.startsWith('image/'),
      });
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };

  const shareOutput = async () => {
    if (!output) return;
    setShareNotice('');
    const sharedFile = new File([output.blob], output.filename, { type: output.blob.type || 'application/octet-stream' });
    if (typeof navigator.share !== 'function') {
      setShareNotice('Este navegador não oferece compartilhamento direto. Baixe o arquivo e envie pelo aplicativo que preferir.');
      return;
    }
    if (navigator.canShare && !navigator.canShare({ files: [sharedFile] })) {
      setShareNotice('Seu navegador não compartilha arquivos diretamente. Baixe o documento para encaminhá-lo manualmente.');
      return;
    }
    try {
      await navigator.share({ title: 'Documento carimbado — Cartório de Notas Inúteis', files: [sharedFile] });
      setShareNotice('Documento compartilhado. A validade jurídica continua exatamente a mesma: nenhuma.');
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      setShareNotice('O compartilhamento não foi concluído. Você ainda pode baixar o arquivo nesta tela.');
    }
  };

  const clearFile = () => {
    setFile(null);
    setOutput(null);
    setError('');
    setShareNotice('');
  };

  return (
    <main className="paper-grain min-h-[100dvh] overflow-hidden bg-[#f1efe6] text-[#203e32]">
      <div className="relative mx-auto max-w-[1240px] px-5 pb-12 pt-6 sm:px-8 lg:px-12 lg:pt-9">
        <header className="entrance flex items-center justify-between border-b border-[#d7d3c6] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="seal-mark flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-[#254b3c] bg-[#254b3c] text-[#f3efe3]" aria-hidden="true">
              <span className="serif text-[29px] leading-none">§</span>
            </div>
            <div className="leading-tight">
              <p className="mono text-[9px] font-medium tracking-[.22em] text-[#61746a] sm:text-[10px]">1º CARTÓRIO DE</p>
              <p className="serif text-[18px] font-semibold tracking-[-.04em] sm:text-[21px]">Notas Inúteis</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#d7d3c6] px-3 py-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#bb654e]" />
            <span className="mono text-[9px] uppercase tracking-[.13em] text-[#66766d]">serviço sem valor legal</span>
          </div>
          <span className="mono text-[9px] uppercase tracking-[.1em] text-[#7c877e] sm:hidden">Desde nunca</span>
        </header>

        <section className="grid items-start gap-12 pb-8 pt-12 sm:pt-16 lg:grid-cols-[1.02fr_.98fr] lg:gap-[8.5%] lg:pt-[86px]">
          <div className="entrance">
            <div className="mb-5 flex items-center gap-3">
              <span className="mono text-[10px] uppercase tracking-[.2em] text-[#b25c48]">Protocolo de inutilidade nº 001</span>
              <span className="h-px w-12 bg-[#bb654e]/60" />
            </div>
            <h1 className="serif max-w-[620px] text-[clamp(3.4rem,8vw,6.25rem)] font-semibold leading-[.93] tracking-[-.065em]">
              Dê ao seu arquivo a <span className="italic text-[#b25c48]">importância</span> que ele não pediu.
            </h1>
            <p className="mt-7 max-w-[475px] text-[16px] leading-[1.75] text-[#61746a] sm:text-[18px]">
              Um carimbo solene para documentos, imagens e decisões questionáveis. Envie o arquivo. A gente cuida da burocracia imaginária.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#68776e]">
              <span className="mono uppercase tracking-[.1em]">PDF · JPG · PNG · WEBP</span>
              <span className="hidden h-1 w-1 rounded-full bg-[#b5afa0] sm:block" />
              <span>Até 15 MB, porque até a piada tem limite</span>
            </div>

            <div className="mt-11 border-l-2 border-[#b65e49] pl-4">
              <p className="mono text-[9px] uppercase tracking-[.18em] text-[#b25c48]">Aviso notarial nada notarial</p>
              <p className="mt-2 max-w-[440px] text-[13px] leading-relaxed text-[#69766d]">
                Este é um serviço de paródia. O carimbo é fictício e não tem validade jurídica, administrativa ou para convencer seu síndico.
              </p>
            </div>
          </div>

          <div className="entrance-delay lg:pt-3">
            <div className="relative rounded-[5px] border border-[#d4d0c4] bg-[#faf8f0] p-5 shadow-[0_18px_60px_rgba(36,54,42,.08)] sm:p-8">
              <div className="absolute -right-2.5 -top-3 rotate-[6deg] border border-[#cbbda5] bg-[#e8e1cf] px-3 py-1.5 mono text-[8px] uppercase tracking-[.16em] text-[#756b59] shadow-sm">
                balcão digital · guichê 01
              </div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="mono text-[9px] uppercase tracking-[.19em] text-[#8a8d7f]">Entrada de documentos</p>
                  <h2 className="serif mt-1 text-[26px] font-semibold tracking-[-.04em]">Protocole seu arquivo</h2>
                </div>
                <div className="mono text-[10px] text-[#929287]">01 / 01</div>
              </div>

              <input
                ref={inputRef}
                type="file"
                className="sr-only"
                accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                onChange={onInputChange}
                data-testid="input-document"
                aria-label="Selecionar um PDF ou imagem"
              />
              <div
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`group rounded-[3px] border border-dashed px-5 py-8 text-center transition-colors duration-200 sm:px-7 sm:py-10 ${dragging ? 'border-[#254b3c] bg-[#e9eee5]' : 'border-[#c9c6b9] bg-[#f4f2e9] hover:border-[#758979]'}`}
                data-testid="dropzone-document"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e4e8de] text-[#315744]">
                  <UploadCloud size={26} strokeWidth={1.55} />
                </div>
                <p className="mt-4 text-[14px] font-semibold text-[#294536]">
                  {file ? 'Arquivo protocolado' : 'Seu documento, por favor'}
                </p>
                <p className="mx-auto mt-1.5 max-w-[300px] text-[12px] leading-relaxed text-[#7b8177]">
                  {file ? 'Confira abaixo e solicite o carimbo de inutilidade.' : 'Arraste para este guichê ou selecione no seu dispositivo.'}
                </p>
                <button
                  type="button"
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] bg-[#254b3c] px-5 text-[12px] font-semibold text-[#f7f4e9] transition hover:bg-[#173d2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b65e49]"
                  onClick={() => inputRef.current?.click()}
                  data-testid="button-select-file"
                >
                  <FileText size={15} />
                  {file ? 'Trocar arquivo' : 'Selecionar arquivo'}
                </button>
                {file && (
                  <div className="mx-auto mt-5 flex max-w-[390px] items-center gap-3 border-t border-[#d8d4c8] pt-4 text-left">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#e4e8de] text-[#315744]">
                      {file.type.startsWith('image/') ? <FileImage size={17} /> : <FileText size={17} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[#344b3c]" data-testid="text-selected-filename">{file.name}</p>
                      <p className="mono mt-0.5 text-[10px] text-[#85877b]">{formatBytes(file.size)} · aguardando carimbo</p>
                    </div>
                    <button type="button" onClick={clearFile} aria-label="Remover arquivo" className="p-2 text-[#8d8b80] transition hover:text-[#a44939]" data-testid="button-remove-file">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div role="alert" className="mt-4 flex items-start gap-2.5 border border-[#e1c4b8] bg-[#fbefea] px-3.5 py-3 text-[12px] leading-relaxed text-[#984b3b]" data-testid="status-error">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={!file || carimbar.isPending}
                className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[3px] bg-[#b65e49] px-5 text-[13px] font-semibold tracking-[.01em] text-[#fff9ed] transition hover:bg-[#a34e3b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254b3c] disabled:cursor-not-allowed disabled:bg-[#d1c4b8] disabled:text-[#f7f0e6]"
                data-testid="button-stamp-file"
              >
                {carimbar.isPending ? (
                  <><LoaderCircle size={17} className="animate-spin" /> Lavrando inutilidades…</>
                ) : (
                  <>Aplicar carimbo fictício <ArrowRight size={16} /></>
                )}
              </button>
              {carimbar.isPending && (
                <p className="mt-3 text-center mono text-[10px] tracking-[.04em] text-[#7b8177]" role="status" data-testid="status-processing">
                  O tabelião está procurando o carimbo. Não há urgência jurídica.
                </p>
              )}

              {output && (
                <section className="mt-6 border-t border-[#d8d4c8] pt-5" aria-live="polite" data-testid="status-success">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e2eadf] text-[#315744]"><Check size={17} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#294536]">Carimbo aplicado com sucesso</p>
                      <p className="mt-1 break-all mono text-[10px] text-[#818579]">{output.filename}</p>
                    </div>
                    <span className="stamp-pop shrink-0 border-2 border-[#b65e49] px-2 py-1 mono text-[8px] font-medium uppercase leading-[1.35] tracking-[.12em] text-[#b65e49]">sem<br />validade</span>
                  </div>
                  <div className="mt-4 overflow-hidden border border-[#ddd8ca] bg-[#efede4]">
                    {output.isImage ? (
                      <img src={output.url} alt="Prévia da imagem com carimbo fictício" className="max-h-[300px] w-full object-contain p-3" data-testid="preview-output" />
                    ) : output.blob.type === 'application/pdf' ? (
                      <iframe title="Prévia do PDF carimbado" src={output.url} className="h-[300px] w-full bg-[#efede4]" data-testid="preview-output" />
                    ) : (
                      <div className="flex min-h-24 items-center gap-3 px-4 py-5 text-[12px] text-[#72796f]">
                        <FileText size={21} /> Prévia indisponível para este tipo de arquivo. O download está pronto.
                      </div>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <a
                      href={output.url}
                      download={output.filename}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-[3px] bg-[#254b3c] px-3 text-[12px] font-semibold text-[#f7f4e9] transition hover:bg-[#173d2e]"
                      data-testid="link-download-output"
                    >
                      <ArrowDownToLine size={15} /> Baixar arquivo
                    </a>
                    <button type="button" onClick={shareOutput} className="flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-[#c9c6b9] bg-transparent px-3 text-[12px] font-semibold text-[#365241] transition hover:bg-[#efede4]" data-testid="button-share-output">
                      <Share2 size={15} /> Compartilhar
                    </button>
                  </div>
                  {shareNotice && <p className="mt-3 text-[11px] leading-relaxed text-[#68766d]" role="status" data-testid="status-share">{shareNotice}</p>}
                  <p className="mt-4 border-l-2 border-[#b65e49] pl-3 text-[11px] leading-relaxed text-[#858174]">
                    Lembrete: este carimbo é uma brincadeira e não possui validade legal.
                  </p>
                </section>
              )}
              {error && !carimbar.isPending && file && (
                <button type="button" onClick={submit} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#315744] hover:text-[#b65e49]" data-testid="button-retry">
                  <RotateCcw size={13} /> Tentar novamente
                </button>
              )}
              <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#e4e0d5] pt-4 text-center mono text-[9px] uppercase tracking-[.1em] text-[#85877b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#77917b]" />
                Arquivo processado sem armazenamento
              </div>
            </div>
            <p className="mt-4 text-center mono text-[9px] uppercase tracking-[.1em] text-[#969589]">Taxa de serviço: uma boa história para contar</p>
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-[#d7d3c6] pt-5 text-[10px] text-[#7e8379] sm:flex-row sm:items-center sm:justify-between">
          <span className="mono uppercase tracking-[.12em]">1º Cartório de Notas Inúteis · Registro ficcional</span>
          <span>Este serviço é uma paródia. Nenhum ato, selo ou documento aqui tem validade jurídica.</span>
        </footer>
      </div>
    </main>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}

export default App;
