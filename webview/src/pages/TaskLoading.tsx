import { createEffect, createResource, createSignal, onCleanup, Show } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import Layout from "../components/Layout";
import { authHeader, getToken } from "../utils/auth";

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

const fetchJob = async (id: string) => {
  const res = await fetch(`/api/jobs/${id}`, { headers: { ...authHeader() } });
  if (!res.ok) return null as unknown as Job;
  return (await res.json()) as Job;
};

const fetchJobs = async () => {
  // Avoid 404/401 flicker when not logged in
  if (!getToken()) return { data: [] } as any;
  const res = await fetch(`/api/jobs`, { headers: { ...authHeader() } });
  if (!res.ok) return { data: [] } as any;
  return await res.json();
};

const TaskLoading = () => {
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
  onCleanup(() => {
    const t = timer();
    if (t) clearInterval(t);
  });

  // ������ɺ��Զ���ת�����ղ鿴ҳ
  createEffect(() => {
    const j = job();
    if (j && j.status === "completed" && j.result) {
      navigate(`/compare/${j.arxiv_id}/${j.result.version}`, { replace: true });
    }
  });

  return (
    <Layout>
      <div class="max-w-6xl mx-auto pt-6">
        <h2 class="text-lg font-semibold">��������</h2>
        <div class="mt-3 p-4 border rounded-lg">
          <div>
            arXiv: <span class="font-mono">{job()?.arxiv_id}</span>
          </div>
          <div class="mt-2">
            ״̬��{job()?.status} {job()?.position && job()?.status === 'queued' ? `(����λ�� ${job()?.position})` : ''}
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-slate-900 h-2 rounded-full" style={{ width: `${job()?.progress ?? 0}%` }}></div>
            </div>
            <div class="text-sm text-gray-600 whitespace-nowrap">{job()?.progress ?? 0}%</div>
          </div>
          <Show when={jobs()}>
            <div class="mt-4 text-sm text-gray-600">��ʷ����{jobs().data?.length || 0} ��</div>
          </Show>
        </div>
      </div>
    </Layout>
  );
};

export default TaskLoading;
