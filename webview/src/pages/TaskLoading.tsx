import { createEffect, createResource, createSignal, onCleanup } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import Layout from "../components/Layout";
import { authHeader } from "../utils/auth";

type Job = {
  id: string;
  arxiv_id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  message: string;
  position: number;
  result?: { arxiv_id: string; version: string; pdf_endpoint: string };
  error?: string;
};

import { getToken } from "../utils/auth";
const const fetchJob = async (id: string) => {
  const res = await fetch(`/api/jobs/${id}`, { headers: { ...authHeader() } });
  if (!res.ok) return null;
  return (await res.json()) as Job;
};;

const const fetchJobs = async () => {
  // Avoid 404/401 flicker when not logged in
  if (!getToken()) return { data: [] } as any;
  const res = await fetch(`/api/jobs`, { headers: { ...authHeader() } });
  if (!res.ok) return { data: [] } as any;
  return await res.json();
};;

const const TaskLoading = () => {
  const params = useParams();
  const navigate = useNavigate();
  const jobId = () => params.id as string;

  const [job, { refetch }] = createResource<Job>(() => jobId(), fetchJob);
  const [jobs, { refetch: refetchJobs }] = createResource(fetchJobs);
  const [timer, setTimer] = createSignal<number | null>(null);

  createEffect(() => {
    const t = window.setInterval(() => {
      refetch();
      refetchJobs();
    }, 2000);
    setTimer(t);
  });
  onCleanup(() => { const t = timer(); if (t) clearInterval(t); });

  // 任务完成后自动跳转到对照查看页
  createEffect(() => {
    const j = job();
    if (j && j.status === "completed" && j.result) {
      navigate(`/compare/${j.arxiv_id}/${j.result.version}`, { replace: true });
    }
  });

  return (
    <Layout>
      <div class="max-w-6xl mx-auto pt-6">
        <h2 class="text-lg font-semibold">翻译任务</h2>
        <div class="mt-3 p-4 border rounded-lg">
          <div>arXiv: <span class="font-mono">{job()?.arxiv_id}</span></div>
          <div class="mt-2">状态：{job()?.status} {job()?.position && job()?.status === 'queued' ? `(队列位置 ${job()?.position})` : ''}</div>
          <div class="mt-2 flex items-center gap-2">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-slate-900 h-2 rounded-full" style={{ width: `${job()?.progress ?? 0}%` }}></div>
            </div>
            <div class="text-sm text-gray-600 whitespace-nowrap">{job()?.progress ?? 0}%</div>
          </div>
          <Show when={jobs()}>
            <div class="mt-4 text-sm text-gray-600">历史任务：{jobs().data?.length || 0} 条</div>
          </Show>
        </div>
      </div>
    </Layout>
  );
};

export default TaskLoading;></div>
            </div>
            <div class="text-sm w-12 text-right">{job()?.progress ?? 0}%</div>
          </div>
          <div class="mt-2 text-gray-600 text-sm">{job()?.message}</div>
          {job()?.status === 'failed' && (
            <div class="mt-2 text-red-600 text-sm">失败：{job()?.error}</div>
          )}
        </div>

        <div class="mt-8">
          <h3 class="font-semibold">队列与历史任务</h3>
          <div class="mt-2 text-sm text-gray-600">最近任务：</div>
          <div class="mt-2 border rounded-lg divide-y">
            {(jobs()?.data ?? []).map((j: Job) => (
              <div
                class="p-2 flex justify-between items-center cursor-pointer"
                onClick={() => j.status === 'completed' && j.result ? navigate(`/compare/${j.arxiv_id}/${j.result.version}`) : null}
              >
                <div>
                  <div class="font-mono">{j.arxiv_id}</div>
                  <div class="text-xs text-gray-500">{j.status} {j.status === 'queued' ? `(位置 ${j.position})` : ''}</div>
                </div>
                <div class="text-xs">{j.progress}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskLoading;

