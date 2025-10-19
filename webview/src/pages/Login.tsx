import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Layout from "../components/Layout";
import { setToken } from "../utils/auth";

const Login = () => {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const navigate = useNavigate();

  const submit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password() })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "登录失败");
      } else {
        const data = await res.json();
        setToken(data.access_token);
        navigate("/", { replace: true });
      }
    } catch (e) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div class="max-w-sm mx-auto pt-10">
        <form onSubmit={submit}>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input
            type="password"
            class="py-2 px-4 bg-white block w-full border border-gray-300 rounded-lg outline-none focus:border-slate-900"
            onInput={(e) => setPassword(e.currentTarget.value)}
          />
          {error() && <p class="mt-2 text-sm text-red-600">{error()}</p>}
          <button
            type="submit"
            disabled={loading()}
            class="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:bg-slate-400"
          >
            {loading() ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Login;

