import { BrowserRouter, Route, Routes } from "react-router-dom";
import FileListPage from "./pages/file/FileListPage";
import FileDetailPage from "./pages/file/FileDetailPage";
import RatioListPage from "./pages/ratio/RatioListPage";
import RatioDetailPage from "./pages/ratio/RatioDetailPage";
import AdminFileListPage from "./pages/admin/AdminFileListPage";
import AddFilePage from "./pages/admin/AddFilePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FileListPage />} />
        <Route path="/file/:id" element={<FileDetailPage />} />
        <Route path="/ratio" element={<RatioListPage />} />
        <Route path="/ratio/:id" element={<RatioDetailPage />} />
        <Route path="/admin" element={<AdminFileListPage />} />
        <Route path="/admin/add" element={<AddFilePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
