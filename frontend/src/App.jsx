import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Hub from "./pages/Hub";
import Letters from "./pages/Letters";

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/letters" element={<Letters />} />
      </Routes>
    </div>
  );
}

export default App;
