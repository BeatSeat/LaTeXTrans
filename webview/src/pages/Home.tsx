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

const const Home = () => {
  const navigate = useNavigate();
  const [history] = createResource(fetchHistory);

  return (
    <Layout>
      <div class="w-full pt-4">
        <div class="max-w-6xl mx-auto">
          <ArxivForm />
        </div>
        <div class="max-w-6xl mx-auto mt-8">
          <div class="font-semibold mb-2">历史翻译</div>
          <Show when={history()} fallback={<div class="text-sm text-gray-500">加载中...</div>}>
            <For each={history()}>
              {(i) => (
                <div class="py-2 border-b flex items-center justify-between">
                  <div>
                    arXiv: <span class="font-mono">{i.arxiv_id}</span> v{i.version}
                  </div>
                  <button
                    class="rounded-md bg-slate-900 px-3 py-1 text-white"
                    onClick={() => navigate(`/compare/${i.arxiv_id}/${i.version}`)}
                  >
                    查看
                  </button>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </Layout>
  );
};

export default Home;>
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
