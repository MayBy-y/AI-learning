import './App.css'
// import { SideBar } from './components/SideBar/SideBar'
import { Chat } from './pages/Chat/Chat'
import { Routes, Route } from 'react-router-dom'
import { Login } from './components/login/login'
import { Register } from './components/login/register'
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

      </Routes>

    </>
  )
}
export default App
