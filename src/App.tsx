import './App.css'
// import { SideBar } from './components/SideBar/SideBar'
import { Chat } from './pages/Chat/Chat'
import { Routes, Route } from 'react-router-dom'
import { Login } from './components/login/login'
import { Register } from './components/login/register'
import AiPlan from './pages/Planning/planComponent'
import KonwledgePage from './pages/Knowledge Base/konwledge'
import { SmallBox } from './pages/Knowledge Base/konwledegSearch'
import { ReviewPart } from './pages/Review/review'
import { Practice } from './pages/Review/reviewPractice'
import { Report } from './pages/Review/reviewRes'
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
                <Route path="/review" element={<ReviewPart />} />
                <Route path="/practice/:id" element={<Practice />} />
                <Route path="/report" element={<Report />} />

            </Routes>

        </>
    )
}
export default App
