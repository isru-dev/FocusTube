import './App.css'
import { Register } from './pages/Register.tsx'
import { Login } from './pages/Login.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { SideBar } from './components/sidebar.tsx'
import { AddChannel } from './components/AddChannel.tsx'
import { Feed } from './components/Feed.tsx'
import { BrowserRouter, Routes, Route } from "react-router-dom"
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
       <Route path="/sidebar" element={<SideBar />} />
    <Route path="/AddChannel" element={<AddChannel />} />
    <Route path="/Feed" element={<Feed />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App