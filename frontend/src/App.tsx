import * as React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import AdminFileListPage from "./pages/admin/AdminFileListPage";
import CustomerListPage from "./pages/admin/CustomerListPage";
import AddFilePage from "./pages/admin/AddFilePage";
import HighNeedleAnnotatorDemoPage from "./pages/dev/HighNeedleAnnotatorDemo";
import HighNeedlePreviewPage from "./pages/dev/HighNeedlePreviewPage";
import FileDetailPage from "./pages/file/FileDetailPage";
import FileListPage from "./pages/file/FileListPage";
import NotFoundPage from "./pages/NotFoundPage";
import RatioDetailPage from "./pages/ratio/RatioDetailPage";
import RatioListPage from "./pages/ratio/RatioListPage";

function FileDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/file/${id}`} replace />;
}

function RatioDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/ratio/${id}`} replace />;
}

function AdminRatioDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/ratio/${id}`} replace />;
}

function AdminRedirect() {
  return <Navigate to="/admin/files" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FileListPage />} />
        <Route path="/file/:id" element={<FileDetailPage />} />
        <Route path="/files/:id" element={<FileDetailRedirect />} />

        <Route path="/ratio" element={<RatioListPage />} />
        <Route path="/ratio/:id" element={<RatioDetailPage />} />
        <Route path="/ratios/:id" element={<RatioDetailRedirect />} />

        <Route path="/admin" element={<AdminRedirect />} />
        <Route path="/admin/files" element={<AdminFileListPage />} />
        <Route path="/admin/add" element={<AddFilePage />} />
        <Route path="/admin/customers" element={<CustomerListPage />} />
        <Route path="/admin/ratio" element={<Navigate to="/ratio" replace />} />
        <Route path="/admin/ratio/:id" element={<AdminRatioDetailRedirect />} />
        <Route
          path="/admin/high-needle-annotator"
          element={<HighNeedleAnnotatorDemoPage />}
        />
        <Route
          path="/admin/high-needle-preview"
          element={<HighNeedlePreviewPage />}
        />
        <Route
          path="/dev/high-needle-annotator"
          element={<Navigate to="/admin/high-needle-annotator" replace />}
        />
        <Route
          path="/dev/high-needle-preview"
          element={<Navigate to="/admin/high-needle-preview" replace />}
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
