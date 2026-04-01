import './Chat.css'
import { useState } from 'react'
import { Mic } from "lucide-react";
import { useNavigate } from 'react-router-dom';
export function TopChat() {
    const [login, setlogin] = useState(false)
    const navigate = useNavigate()
    return <>
        <div className='top'>
            <h2>AI Learning</h2>
            {!login && <div className='login'><button onClick={() => {
                navigate('/login')
                setlogin(false)
            }
            }>登录</button> <button onClick={() => navigate('/register')}>注册</button></div>}
        </div>
    </>
}

export function ChatView() {
    // const [say, setSay] = useState('')
    return <section className='chatView'>
        <h2> 今天要学习什么 </h2>
        <div className='inputDiv'>
            <span>✚</span>
            <input type="text" />
            <button><Mic /></button>
        </div>
    </section>
}