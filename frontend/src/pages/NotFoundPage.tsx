import * as React from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageShell
      title="页面不存在"
      actions={
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => navigate("/")}
        >
          回到首页
        </button>
      }
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        当前地址没有匹配到页面，请通过上方导航进入。
      </div>
    </PageShell>
  );
}
