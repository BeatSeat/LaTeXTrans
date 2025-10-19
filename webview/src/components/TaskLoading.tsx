import { Show } from "solid-js";
import SpinnerIcon from "./icons/SpinnerIcon";
import { A } from "@solidjs/router";
import Layout from "./Layout";

interface TaskLoadingProps {
  type: "arxiv" | "file";
  status: string;
  info: string;
  tarPath?: string;
}

const TaskLoading = (props: TaskLoadingProps) => {
  const statusMessages = {
    error: "翻译出错，可能这篇论文没有源码。",
    start: "开始翻译，通常需要 1-10 分钟。",
    processing: "翻译中...",
    failed: `翻译失败${props.type === "arxiv" ? "，对于 arXiv 论文，我们会定期检查失败任务并修复，请等待或联系我们加速处理" : "，PDF 翻译功能目前还处在实验阶段，正在开发新版"}`,
    fault: "编译失败，请下载源码浏览",
  };

  return (
    <div class="flex flex-auto flex-col justify-center items-center p-4">
      <div class="flex justify-center">
        <p>{statusMessages[props.status] || "任务正在初始化..."}</p>
      </div>
      <Show
        when={
          props.status !== "failed" &&
          props.status !== "init" &&
          props.status !== "error" &&
          props.status !== "fault"
        }
      >
        <div class="grid min-h-[100px] w-full place-items-center rounded-lg p-2">
          <SpinnerIcon />
          <div class="text-sm text-gray-500">{props.info}</div>
        </div>
      </Show>
      <Show when={props.tarPath}>
        <A
          href={props.tarPath}
          target="_blank"
          class="text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950 "
        >
          下载翻译后的 LaTeX 源码
        </A>
      </Show>
    </div>
  );
};

export default TaskLoading;
