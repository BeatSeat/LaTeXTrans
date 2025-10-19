import { createSignal, Show } from "solid-js";
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
  const [tab, setTab] = createSignal<"zh" | "origin">(
    props.zhCNPDFPath ? "zh" : "origin"
  );

  const currentSrc = () => (tab() === "zh" ? props.zhCNPDFPath : props.originPDFPath) || "";
  const { PDFSlickViewer, viewerRef, pdfSlickStore: store } = usePDFSlick(
    currentSrc as any,
    pdfOptions
  );

  return (
    <Layout>
      <div class="flex items-center justify-between mb-3">
        <div class="inline-flex rounded-lg bg-stone-100 p-1">
          <button
            class="px-3 py-1 text-sm rounded-md"
            classList={{ "bg-white shadow": tab() === "zh" }}
            onClick={() => setTab("zh")}
            disabled={!props.zhCNPDFPath}
          >
            中文译文
          </button>
          <button
            class="ml-2 px-3 py-1 text-sm rounded-md"
            classList={{ "bg-white shadow": tab() === "origin" }}
            onClick={() => setTab("origin")}
            disabled={!props.originPDFPath}
          >
            原文
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
              下载译文 LaTeX 源码
            </a>
          </Show>
        </div>
      </div>
      <div class="relative h-[calc(100vh-8rem)] bg-white rounded-md border">
        <Show when={!!currentSrc()} fallback={<div class="p-4 text-sm text-gray-600">暂无可展示的 PDF</div>}>
          <PDFSlickViewer store={store as any} viewerRef={viewerRef as any} />
        </Show>
      </div>
    </Layout>
  );
};

export default PDFViewer;
