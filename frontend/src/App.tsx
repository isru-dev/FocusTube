import "./App.css";
import { Register } from "./pages/Register.tsx";
import { Login } from "./pages/Login.tsx";
import { SideBar } from "./components/sidebar.tsx";
import {ProtectedRoute} from './lib/ProtectedRoute.tsx'
import { AddChannel } from "./components/AddChannel.tsx";
import { Feed } from "./components/Feed.tsx";
import { Home } from "./pages/Home.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sidebar" element={<SideBar />} />
        <Route
          path="/AddChannel"
          element={
            <ProtectedRoute>
              <AddChannel />
            </ProtectedRoute>
          }
        />
        <Route path="/Feed" element={
           <ProtectedRoute>
             <Feed />
            </ProtectedRoute>
          } />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
