import { createMemo, createSignal, Show } from "solid-js";
import { usePDFSlick } from "@pdfslick/solid";
import Layout from "./Layout";

interface PDFViewerProps {
  originPDFPath?: string;
  zhCNPDFPath?: string;
  zhCNTarPath?: string;
  isDeepSeek?: boolean;
}

const pdfOptions = {
  getDocumentParams: {
    cMapUrl: "https://cdn.hjfy.top/web/pdfjs/cmaps/",
    standardFontDataUrl: "https://cdn.hjfy.top/web/pdfjs/standard_fonts/",
  },
};

const PDFViewer = (props: PDFViewerProps) => {
  const bothAvailable = createMemo(() => !!props.zhCNPDFPath && !!props.originPDFPath);
  const [mode, setMode] = createSignal<"both" | "zh" | "origin">(
    bothAvailable() ? "both" : (props.zhCNPDFPath ? "zh" : "origin")
  );

  const zhSrc = () => props.zhCNPDFPath || "";
  const originSrc = () => props.originPDFPath || "";

  const {
    PDFSlickViewer: ZhViewer,
    viewerRef: zhRef,
    pdfSlickStore: zhStore,
  } = usePDFSlick(zhSrc as any, pdfOptions);

  const {
    PDFSlickViewer: OriginViewer,
    viewerRef: originRef,
    pdfSlickStore: originStore,
  } = usePDFSlick(originSrc as any, pdfOptions);

  return (
    <Layout>
      <div class="flex items-center justify-between mb-3">
        <div class="inline-flex rounded-lg bg-stone-100 p-1">
          <button
            class="px-3 py-1 text-sm rounded-md"
            classList={{ "bg-white shadow": mode() === "both" }}
            onClick={() => setMode("both")}
            disabled={!bothAvailable()}
          >
            双栏
          </button>
          <button
            class="ml-2 px-3 py-1 text-sm rounded-md"
            classList={{ "bg-white shadow": mode() === "zh" }}
            onClick={() => setMode("zh")}
            disabled={!props.zhCNPDFPath}
          >
            只看译文
          </button>
          <button
            class="ml-2 px-3 py-1 text-sm rounded-md"
            classList={{ "bg-white shadow": mode() === "origin" }}
            onClick={() => setMode("origin")}
            disabled={!props.originPDFPath}
          >
            只看原文
          </button>
        </div>
        <div class="text-sm text-gray-600 flex items-center gap-3">
          <Show when={props.isDeepSeek}>
            <span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">DeepSeek</span>
          </Show>
          <Show when={props.zhCNTarPath}>
            <a
              href={props.zhCNTarPath}
              target="_blank"
              class="text-zinc-950 underline decoration-zinc-950/50 hover:decoration-zinc-950"
            >
              下载中文 LaTeX 源码
            </a>
          </Show>
        </div>
      </div>

      <Show when={mode() === "both"} fallback={
        <div class="relative h-[calc(100vh-8rem)] bg-white rounded-md border">
          <Show when={mode() === 'zh'}>
            <Show when={!!zhSrc()} fallback={<div class="p-4 text-sm text-gray-600">无可展示的 PDF</div>}>
              <ZhViewer store={zhStore as any} viewerRef={zhRef as any} />
            </Show>
          </Show>
          <Show when={mode() === 'origin'}>
            <Show when={!!originSrc()} fallback={<div class="p-4 text-sm text-gray-600">无可展示的 PDF</div>}>
              <OriginViewer store={originStore as any} viewerRef={originRef as any} />
            </Show>
          </Show>
        </div>
      }>
        <div class="grid grid-cols-2 gap-2 h-[calc(100vh-8rem)]">
          <div class="relative bg-white rounded-md border overflow-hidden">
            <div class="px-3 py-2 text-xs text-gray-600 border-b">中文译文</div>
            <Show when={!!zhSrc()} fallback={<div class="p-4 text-sm text-gray-600">无可展示的 PDF</div>}>
              <ZhViewer store={zhStore as any} viewerRef={zhRef as any} />
            </Show>
          </div>
          <div class="relative bg-white rounded-md border overflow-hidden">
            <div class="px-3 py-2 text-xs text-gray-600 border-b">原文</div>
            <Show when={!!originSrc()} fallback={<div class="p-4 text-sm text-gray-600">无可展示的 PDF</div>}>
              <OriginViewer store={originStore as any} viewerRef={originRef as any} />
            </Show>
          </div>
        </div>
      </Show>
    </Layout>
  );
};

export default PDFViewer;

