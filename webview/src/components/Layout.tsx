import { JSX } from "solid-js";
import Header from "./Header";

const Layout = (props: { children: JSX.Element }) => {
  return (
    <div class="flex flex-col min-h-screen max-w-screen">
      <div
        class="absolute inset-x-0 -z-10 transform-gpu overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div
          class="relative left-[40%] top-[25rem] aspect-1155/678 w-[60rem] -translate-x-1/2 rotate-[0deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-15"
          style="clip-path:polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
        ></div>
      </div>
      <Header />
      <main class="max-w-screen relative grid flex-1 grid-cols-[1fr_2.5rem_auto_2.5rem_1fr] grid-rows-[2rem_1px_auto_1px_1fr] [--pattern-fg:var(--color-gray-950)]/5 ">
        <div class="col-start-3 row-start-3 flex flex-col p-4">
          {props.children}
        </div>
        {/* Pattern lines omitted for brevity but would be here */}
      </main>
      <footer class="col-start-3 row-start-5 ">
        <div class="mx-auto p-4 text-sm/6 text-gray-600 md:flex md:items-center md:justify-between">
          <div class="flex justify-center gap-x-6 md:order-2 md:mt-0">
            京 ICP 备 2025111180 号
          </div>
          <div class="flex justify-center gap-x-6 md:order-3">
            <a href="https://www.xiaohongshu.com/user/profile/55aa3eaee4b1cf372e3e47cf">
              小红书
            </a>
            <a href="mailto:public@cyberwalnut.top">联系邮箱</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
