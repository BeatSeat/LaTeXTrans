import { createSignal, onMount, createEffect } from "solid-js";
import { createStore } from "solid-js/store";

async function fetchTaskFiles(id: string, type: "arxiv" | "file") {
  const res = await fetch(`/api/${type}Files/${id}`);
  const json = await res.json();
  if (json.status === 0) return json.data;
  return null;
}

async function pollStatus(
  id: string,
  type: "arxiv" | "file",
  setStatus,
  setInfo,
  setData,
  setNeedsLogin,
) {
  try {
    const res = await fetch(`/api/${type}Status/${id}`);
    const json = await res.json();

    if (json.status === 0) {
      const { status, info } = json.data;
      if (info) setInfo(info);

      if (status === "finished") {
        setStatus("finished");
        const fileData = await fetchTaskFiles(id, type);
        if (fileData) {
          if (fileData.title) document.title = fileData.title;
          setData(fileData);
        }
      } else if (["failed", "error", "fault"].includes(status)) {
        setStatus(status);
        const fileData = await fetchTaskFiles(id, type); // might have tarball on failure
        if (fileData) setData(fileData);
      } else {
        setStatus(status || "start");
        setTimeout(
          () =>
            pollStatus(id, type, setStatus, setInfo, setData, setNeedsLogin),
          10000,
        );
      }
    } else if (json.status === 101) {
      setNeedsLogin(true);
    } else {
      console.error(json);
      setStatus("failed");
    }
  } catch (err) {
    console.error(err);
    setStatus("failed");
  }
}

export const useTask = (id: string, type: "arxiv" | "file") => {
  const [status, setStatus] = createSignal("init");
  const [info, setInfo] = createSignal("");
  const [needsLogin, setNeedsLogin] = createSignal(false);
  const [data, setData] = createStore({
    id: "",
    title: "",
    origin: "",
    zhCN: "",
    zhCNTar: "",
    isDeepSeek: false,
  });

  onMount(() => {
    if (id) {
      pollStatus(id, type, setStatus, setInfo, setData, setNeedsLogin);
    }
  });

  return { status, info, data, needsLogin };
};
