import { For, Show, createResource } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Layout from "../components/Layout";
import ArxivForm from "../components/ArxivForm";
import { authHeader } from "../utils/auth";

type HistoryItem = { arxiv_id: string; version: string; mtime: number };

const fetchHistory = async () => {
  const res = await fetch("/api/history", { headers: { ...authHeader() } });
  if (!res.ok) return [] as HistoryItem[];
  const data = await res.json();
  return (data.data as HistoryItem[]) ?? [];
};

const Home = () => {
  const navigate = useNavigate();
  const [history] = createResource(fetchHistory);

  return (
    <Layout>
      <div class="w-full pt-4">
        <div class="max-w-3xl mx-auto">
          <ArxivForm />
        </div>
        <div class="max-w-3xl mx-auto mt-8">
          <div class="font-semibold mb-2">历史翻译</div>
          <Show when={history()} fallback={<div class="text-sm text-gray-500">加载中...</div>}>
            <div class="space-y-2">
              <For each={history()?.slice(0, 20)}>
                {(item, i) => (
                  <div
                    class="text-sm cursor-pointer hover:underline"
                    onClick={() => navigate(`/compare/${item.arxiv_id}/${item.version}`)}
                  >
                    [{i() + 1}] {item.arxiv_id} v{item.version}
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
