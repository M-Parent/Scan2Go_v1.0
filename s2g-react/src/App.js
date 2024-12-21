//import react-router-dom
import { Route, Routes } from "react-router-dom";
//import page
import { Home } from "./pages/Home";
import { Atoms } from "./pages/Atoms";
import { Molecules } from "./pages/Molecules";
import { Organisms } from "./pages/Organisms";

//import Component
import { Nav } from "./component/molecules/Nav";

export function App() {
  return (
    <>
      <Nav />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Atoms" element={<Atoms />} />
          <Route path="/Molecules" element={<Molecules />} />
          <Route path="/Organisms" element={<Organisms />} />
        </Routes>
      </div>
    </>
  );
}
