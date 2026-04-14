import * as React from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import AdminFileListPage from "./pages/admin/AdminFileListPage";
import AddFilePage from "./pages/admin/AddFilePage";
import CustomerListPage from "./pages/admin/CustomerListPage";
import LoginPage from "./pages/auth/LoginPage";
import HighNeedleAnnotatorDemoPage from "./pages/dev/HighNeedleAnnotatorDemo";
import HighNeedlePreviewPage from "./pages/dev/HighNeedlePreviewPage";
import DesignDraftListPage from "./pages/design/DesignDraftListPage";
import ABCreateWizardPage from "./pages/design/create/ABCreateWizardPage";
import DesignCreateHubPage from "./pages/design/create/DesignCreateHubPage";
import ManualCreateWizardPage from "./pages/design/create/ManualCreateWizardPage";
import ImportExcelWizardPage from "./pages/design/create/ImportExcelWizardPage";
import FileDetailPage from "./pages/file/FileDetailPage";
import FileListPage from "./pages/file/FileListPage";
import WelcomePage from "./pages/home/WelcomePage";
import NotFoundPage from "./pages/NotFoundPage";
import RatioDetailPage from "./pages/ratio/RatioDetailPage";
import RatioListPage from "./pages/ratio/RatioListPage";
import TestPage from "./pages/test/TestPage";
import UserManagementPage from "./pages/users/UserManagementPage";

function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem("demo_login_account"));
}

function RequireLogin() {
  const location = useLocation();

  if (!isLoggedIn()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页是公共页面；已登录则跳到首页 */}
        <Route
          path="/login"
          element={
            isLoggedIn() ? <Navigate to="/welcome" replace /> : <LoginPage />
          }
        />

        {/* 其余页面都需要登录 */}
        <Route element={<RequireLogin />}>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<WelcomePage />} />

          <Route path="/designs" element={<DesignDraftListPage />} />
          <Route path="/designs/create" element={<DesignCreateHubPage />} />
          <Route
            path="/designs/create/manual"
            element={<ManualCreateWizardPage />}
          />
          <Route path="/designs/create/ab" element={<ABCreateWizardPage />} />
          <Route
            path="/designs/create/import"
            element={<ImportExcelWizardPage />}
          />

          <Route path="/ratio" element={<RatioListPage />} />
          <Route path="/ratio/:id" element={<RatioDetailPage />} />
          <Route path="/ratios/:id" element={<RatioDetailRedirect />} />

          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/users" element={<UserManagementPage />} />

          <Route path="/test" element={<TestPage />} />
          <Route path="/test/files" element={<FileListPage />} />
          <Route path="/test/admin/files" element={<AdminFileListPage />} />
          <Route path="/test/admin/add" element={<AddFilePage />} />
          <Route path="/test/admin/customers" element={<CustomerListPage />} />
          <Route path="/test/ratio" element={<RatioListPage />} />
          <Route path="/test/ratio/:id" element={<RatioDetailPage />} />
          <Route
            path="/test/high-needle-annotator"
            element={<HighNeedleAnnotatorDemoPage />}
          />
          <Route
            path="/test/high-needle-preview"
            element={<HighNeedlePreviewPage />}
          />

          <Route path="/file/:id" element={<FileDetailPage />} />
          <Route path="/files/:id" element={<FileDetailRedirect />} />

          {/* --- 旧路径兼容（便于从历史链接跳转） --- */}
          <Route path="/admin" element={<Navigate to="/test" replace />} />
          <Route
            path="/admin/files"
            element={<Navigate to="/test/admin/files" replace />}
          />
          <Route
            path="/admin/add"
            element={<Navigate to="/test/admin/add" replace />}
          />
          <Route
            path="/admin/customers"
            element={<Navigate to="/customers" replace />}
          />
          <Route path="/admin/ratio" element={<Navigate to="/ratio" replace />} />
          <Route path="/admin/ratio/:id" element={<AdminRatioDetailRedirect />} />
          <Route
            path="/admin/high-needle-annotator"
            element={<Navigate to="/test/high-needle-annotator" replace />}
          />
          <Route
            path="/admin/high-needle-preview"
            element={<Navigate to="/test/high-needle-preview" replace />}
          />
          <Route
            path="/dev/high-needle-annotator"
            element={<Navigate to="/test/high-needle-annotator" replace />}
          />
          <Route
            path="/dev/high-needle-preview"
            element={<Navigate to="/test/high-needle-preview" replace />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
