import './App.css'
// import { SideBar } from './components/SideBar/SideBar'
import { Chat } from './pages/Chat/Chat'
import { Routes, Route } from 'react-router-dom'
import { Login } from './components/login/login'
import { Register } from './components/login/register'
import AiPlan from './pages/Planning/planComponent'
import KonwledgePage from './pages/Knowledge Base/konwledge'
import { SmallBox } from './pages/Knowledge Base/konwledegSearch'
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/plan" element={<AiPlan />} />
        <Route path="/konwledge" element={<KonwledgePage />} />
        <Route path="/konwledgeDtail/:id" element={<SmallBox />} />
      </Routes>

    </>
  )
}
export default App
