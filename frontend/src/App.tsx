import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import CustomerListPage from "./pages/admin/CustomerListPage";
import EditFilePage from "./pages/admin/EditFilePage";
import LoginPage from "./pages/auth/LoginPage";
import CdrToSvgPage from "./pages/dev/CdrToSvgPage";
import HandWovenAnnotatorPage from "./pages/dev/HandWovenAnnotatorPage";
import HandWovenInstructionTestPage from "./pages/dev/HandWovenInstructionTestPage";
import TestPagesHome from "./pages/dev/TestPagesHome";
import DesignDraftListPage from "./pages/design/DesignDraftListPage";
import ABCreateWizardPage from "./pages/design/create/ABCreateWizardPage";
import DesignCreateHubPage from "./pages/design/create/DesignCreateHubPage";
import ManualCreateWizardPage from "./pages/design/create/ManualCreateWizardPage";
import FileDetailPage from "./pages/file/FileDetailPage";
import PrintSpecPage from "./pages/file/PrintSpecPage";
import HatMakingDetailPage from "./pages/hatMaking/HatMakingDetailPage";
import HatMakingListPage from "./pages/hatMaking/HatMakingListPage";
import WelcomePage from "./pages/home/WelcomePage";
import NotFoundPage from "./pages/NotFoundPage";
import RatioDetailPage from "./pages/ratio/RatioDetailPage";
import RatioListPage from "./pages/ratio/RatioListPage";
import HandWovenSvgEditorPage from "./pages/svg_editor/HandWovenSvgEditorPage";
import HighNeedleSvgEditorPage from "./pages/svg_editor/HighNeedleSvgEditorPage";
import SvgEditorTestPage from "./pages/svg_editor/SvgEditorTestPage";
import UserManagementPage from "./pages/users/UserManagementPage";
import { isLoggedIn } from "./auth";

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
  return <Navigate to="/ratio" replace />;
}

function HatMakingDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/hat-making/${id}`} replace />;
}

function App() {
  const env = (
    import.meta as {
      env?: { BASE_URL?: string; MODE?: string; VITE_ROUTER_MODE?: string };
    }
  ).env;
  const baseUrl = (env?.BASE_URL ?? "/").replace(/\/$/, "") || "/";
  const routerMode =
    env?.VITE_ROUTER_MODE ?? (env?.MODE === "development" ? "browser" : "hash");
  const Router = routerMode === "hash" ? HashRouter : BrowserRouter;
  // HashRouter parses routes from location.hash; passing a basename like "/pss"
  // would require URLs like "/#/pss/..." and will otherwise warn + render nothing.
  const routerBasename =
    routerMode === "hash" || baseUrl === "/" ? undefined : baseUrl;

  return (
    <Router basename={routerBasename}>
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
          <Route path="/designs/:id/edit" element={<EditFilePage />} />
          <Route
            path="/designs/create/manual"
            element={<ManualCreateWizardPage />}
          />
          <Route path="/designs/create/ab" element={<ABCreateWizardPage />} />

          <Route path="/edit" element={<Navigate to="/test/svg-demo" replace />} />
          <Route path="/edit/*" element={<Navigate to="/test/svg-demo" replace />} />

          <Route path="/hat-making" element={<HatMakingListPage />} />
          <Route path="/hat-making/:id" element={<HatMakingDetailPage />} />
          <Route path="/hatMaking/:id" element={<HatMakingDetailRedirect />} />

          <Route path="/ratio" element={<RatioListPage />} />
          <Route path="/ratio/detail" element={<RatioDetailPage />} />
          <Route path="/ratio/:id" element={<RatioDetailRedirect />} />
          <Route path="/ratios/:id" element={<RatioDetailRedirect />} />

          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/users" element={<UserManagementPage />} />

          <Route
            path="/test"
            element={<TestPagesHome />}
          />
          <Route
            path="/test/hand-woven-annotator"
            element={<HandWovenAnnotatorPage />}
          />
          <Route
            path="/test/hand-woven-instruction"
            element={<HandWovenInstructionTestPage />}
          />
          <Route
            path="/test/cdr-to-svg"
            element={<CdrToSvgPage />}
          />
          <Route
            path="/high-needle-svg-editor"
            element={<HighNeedleSvgEditorPage />}
          />
          <Route
            path="/hand-woven-svg-editor"
            element={<HandWovenSvgEditorPage />}
          />
          <Route path="/test/svg-demo" element={<SvgEditorTestPage />} />

          <Route path="/file/:id" element={<FileDetailPage />} />
          <Route path="/file/:id/print" element={<PrintSpecPage />} />
          <Route path="/files/:id" element={<FileDetailRedirect />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
