import './Chat.css'
import { useState } from 'react'
import { Mic } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import axios from "axios"
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
    const [say, setSay] = useState('')
    const [start, setstart] = useState(true)
    const [message, setmessage] = useState<string[]>([])
    async function putMsg() {
        if (!say.trim()) return alert('请输入问题')
        setmessage(prev => [...prev, say])
        const res = await axios.post('http://localhost:3000/api/ai/aiChat')
        console.log(res);
        setmessage(prev => [...prev, res.data.reply])
        setSay('')
        setstart(false)
    }

    return <section className='chatView'>
        {start && <h2> 今天要学习什么 </h2>}
        {!start &&
            <div className='msgList'>
                {message.map((msg, index) => (
                    <div key={index} className="message">
                        <span>{msg}</span>
                    </div>
                ))}
            </div>
        }
        <div className='inputDiv'>
            <span>✚</span>
            <input type="text"
                value={say}
                onChange={(e) => setSay(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") putMsg();
                }}
            />
            <button><Mic /></button>
            <button className='puton'
                onClick={putMsg}
            ><svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
                </svg></button>
        </div>
    </section>
}
