import { render } from "solid-js/web";
import { Router, Route, useNavigate } from "@solidjs/router";
import { Suspense, ParentProps, onMount } from "solid-js";
import "./index.css";
import "@pdfslick/solid/dist/pdf_viewer.css";

import Home from "./pages/Home";
import { Toaster } from "./components/Toaster";
import SpinnerIcon from "./components/icons/SpinnerIcon";
import Login from "./pages/Login";
import History from "./pages/History";
import { getToken } from "./utils/auth";
import TaskLoading from "./pages/TaskLoading";
import Compare from "./pages/Compare";

const RequireAuth = (props: ParentProps) => {
  const navigate = useNavigate();
  onMount(() => {
    if (!getToken()) navigate("/login", { replace: true });
  });
  return <>{props.children}</>;
};

const App = () => {
  return (
    <>
      <Router>
        <Suspense
          fallback={
            <div class="w-full h-screen grid place-items-center">
              <SpinnerIcon />
            </div>
          }
        >
          <Route path="/login" component={Login} />
          <Route path="/" component={() => (
            <RequireAuth>
              <Home />
            </RequireAuth>
          )} />
          <Route path="/history" component={() => (
            <RequireAuth>
              <History />
            </RequireAuth>
          )} />
          <Route path="/task/:id" component={() => (
            <RequireAuth>
              <TaskLoading />
            </RequireAuth>
          )} />
          <Route path="/compare/:arxiv/:version" component={() => (
            <RequireAuth>
              <Compare />
            </RequireAuth>
          )} />
        </Suspense>
      </Router>
      <Toaster />
    </>
  );
};

render(() => <App />, document.getElementById("root") as HTMLElement);
