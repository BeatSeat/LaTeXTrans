import { createSignal, Show } from "solid-js";
import { extractArxivId } from "../utils/arxiv";
import { authHeader } from "../utils/auth";
import { useNavigate } from "@solidjs/router";

const ArxivForm = () => {
  const [inputValue, setInputValue] = createSignal("");
  const [error, setError] = createSignal("");
  const [status, setStatus] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const navigate = useNavigate();
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setStatus("");
    const id = extractArxivId(inputValue());
    if (!id) {
      setError("请输入正确的 arXiv 链接或 ID");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ arxiv_id: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.message || "任务已开始");
        if (data.job_id) {
          navigate(`/task/${data.job_id}`);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || "启动任务失败");
      }
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="rounded-xl text-sm/7 text-gray-700">
      <form onSubmit={handleSubmit}>
        <input
          name="arxivInput"
          type="text"
          placeholder="例如：https://arxiv.org/abs/1706.03762 或 1706.03762"
          class="py-2 px-4 bg-white block w-full border border-gray-300 rounded-lg transition-all duration-200 ease-in sm:text-sm outline-none focus:border-slate-900 focus:ring-3 focus:ring-slate-300"
          classList={{ "border-red-600": !!error() }}
          onInput={(e) => setInputValue(e.currentTarget.value)}
        />
        <Show when={error()}>
          <p class="mt-2 text-sm text-red-600">{error()}</p>
        </Show>
        <Show when={status()}>
          <p class="mt-2 text-sm text-green-600">{status()}</p>
        </Show>
        <div class="mt-4">
          <button
            type="submit"
            class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white cursor-pointer"
            disabled={loading()}
          >
            {loading() ? "处理中..." : "开始翻译"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArxivForm;
