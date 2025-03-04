//import react-router-dom
import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Project } from "./pages/Project";

export function App() {
  return (
    <>
      {/* <Nav /> */}
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:projectId" element={<Project />} />{" "}
        </Routes>
      </div>
    </>
  );
}
