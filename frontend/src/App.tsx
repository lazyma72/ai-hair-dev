import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import AdminFileListPage from "./pages/admin/AdminFileListPage";
import AddFilePage from "./pages/admin/AddFilePage";
import FileListPage from "./pages/file/FileListPage";
import FileDetailPage from "./pages/file/FileDetailPage";
import RatioListPage from "./pages/ratio/RatioListPage";
import RatioDetailPage from "./pages/ratio/RatioDetailPage";

function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-wide text-slate-900">
            沐茵丝假发成品稿管理
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink
              to="/files"
              className={({ isActive }) =>
                `rounded px-3 py-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              成品稿
            </NavLink>
            <NavLink
              to="/ratios"
              className={({ isActive }) =>
                `rounded px-3 py-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              胶丝比例
            </NavLink>
            <NavLink
              to="/admin/files"
              className={({ isActive }) =>
                `rounded px-3 py-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              管理后台
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/files" replace />} />
          <Route path="/files" element={<FileListPage />} />
          <Route path="/files/:id" element={<FileDetailPage />} />
          <Route path="/ratios" element={<RatioListPage />} />
          <Route path="/ratios/:id" element={<RatioDetailPage />} />
          <Route path="/admin/files" element={<AdminFileListPage />} />
          <Route path="/admin/files/add" element={<AddFilePage />} />
          <Route path="/admin/files/:id" element={<FileDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
