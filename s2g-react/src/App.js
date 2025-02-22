//import react-router-dom
import { Routes, Route } from "react-router-dom";
//import page
import { Home } from "./pages/Home";
import { Project } from "./pages/Project";
import { FileIndex } from "./pages/FileIndex";

export function App() {
  return (
    <>
      {/* <Nav /> */}
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:projectId" element={<Project />} />{" "}
          {/* Dynamic route */}
          <Route path="/FileIndex" element={<FileIndex />} />
        </Routes>
      </div>
    </>
  );
}
