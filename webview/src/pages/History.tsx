import { createResource, For, Show } from "solid-js";
import Layout from "../components/Layout";
import { authHeader } from "../utils/auth";

type Item = { arxiv_id: string; version: string; mtime: number };

const fetchHistory = async () => {
  const res = await fetch("/api/history", { headers: { ...authHeader() } });
  if (!res.ok) throw new Error("failed");
  const data = await res.json();
  return data.data as Item[];
};

const openPdf = async (item: Item) => {
  const res = await fetch(`/api/pdf/${item.arxiv_id}/${item.version}`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

const History = () => {
  const [history] = createResource(fetchHistory);
  return (
    <Layout>
      <div class="w-full pt-4">
        <Show when={history()} fallback={<div>加载中...</div>}>
          <For each={history()}>
            {(item) => (
              <div class="flex items-center justify-between py-2 border-b">
                <div>
                  <div class="font-mono">{item.arxiv_id} v{item.version}</div>
                  <div class="text-xs text-gray-500">{new Date(item.mtime * 1000).toLocaleString()}</div>
                </div>
                <button class="rounded-md bg-slate-900 px-3 py-1 text-white" onClick={() => openPdf(item)}>
                  查看PDF
                </button>
              </div>
            )}
          </For>
        </Show>
      </div>
    </Layout>
  );
};

export default History;

