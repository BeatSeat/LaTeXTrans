import { createEffect, createSignal, onCleanup } from "solid-js";
import { useParams } from "@solidjs/router";
import Layout from "../components/Layout";
import PDFViewer from "../components/PDFViewer";
import { authHeader } from "../utils/auth";

const Compare = () => {
  const params = useParams();
  const arxivId = () => params.arxiv as string;
  const version = () => params.version as string;

  const [originUrl, setOriginUrl] = createSignal<string>("");
  const [zhUrl, setZhUrl] = createSignal<string>("");
  const [timer, setTimer] = createSignal<number | null>(null);

  const fetchBlobUrl = async (endpoint: string) => {
    const res = await fetch(endpoint, { headers: { ...authHeader() } });
    if (!res.ok) return "";
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };

  const load = async () => {
    const [o, z] = await Promise.all([
      fetchBlobUrl(`/api/original_pdf/${arxivId()}`),
      fetchBlobUrl(`/api/pdf/${arxivId()}/${version()}`),
    ]);
    setOriginUrl(o);
    setZhUrl(z);
  };

  createEffect(() => {
    load();
    // Optional: refresh links periodically in case of token changes
    const t = window.setInterval(load, 60_000);
    setTimer(t);
  });
  onCleanup(() => {
    const t = timer();
    if (t) clearInterval(t);
    // Revoke object URLs
    if (originUrl()) URL.revokeObjectURL(originUrl());
    if (zhUrl()) URL.revokeObjectURL(zhUrl());
  });

  return (
    <div class="px-2 pt-3">
      <div class="text-sm text-gray-600 mb-2">
        ���ղ鿴��<span class="font-mono">{arxivId()}</span> v{version()}
      </div>
      <PDFViewer originPDFPath={originUrl()} zhCNPDFPath={zhUrl()} />
    </div>
  );
};

export default Compare;
