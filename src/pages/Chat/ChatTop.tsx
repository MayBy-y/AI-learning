import './Chat.css'
import { useState, useRef, useEffect } from 'react'
import { Mic } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../../components/login/UserProfile';
import request from '../../utils/request';
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github.css"
// import ReactMarkdown from "react-markdown"
// import remarkGfm from "remark-gfm"
export function TopChat() {
    const navigate = useNavigate()
    const token = localStorage.getItem("token")
    return <>
        <div className='top'>
            <h2>AI Learning</h2>
            {!token &&
                (<div className='login'>
                    <button
                        onClick={() => {
                            navigate('/login')
                        }
                        }>登录</button>
                    <button onClick={() => navigate('/register')}>注册</button></div>)}
            {token && <UserProfile />}
        </div>
    </>
}
type SideBarProps = {
    start: boolean
    conversationId: string
    setstart: (item: boolean) => void
    setConversationId: React.Dispatch<React.SetStateAction<string>>
    message: any[];
    setMessage: React.Dispatch<React.SetStateAction<any[]>>;
}

export function ChatView({ start, setstart, conversationId, setConversationId, message, setMessage }: SideBarProps) {
    const [say, setSay] = useState('')


    const bottomRef = useRef(null)
    const scrollTimer = useRef(null)

    useEffect(() => {
        if (scrollTimer.current) return

        scrollTimer.current = setTimeout(() => {
            bottomRef.current?.scrollIntoView({
                behavior: 'smooth'
            })
            scrollTimer.current = null
        }, 30) // 30ms 合并滚动
    }, [message])
    useEffect(() => {
        if (start) {
            setMessage([]);
        }
    }, [start]);

    //发送消息
    async function putMsg() {
        if (!say.trim()) return alert('请输入问题')
        const userMsg = say
        let newId
        const user = await request.get("/user/me")
        const userId = user.data.user.id
        if (!conversationId) {

            const res = await request.post('/ai/create', { userId: userId })
            console.log(res.data);
            setConversationId(res.data.id)
            newId = res.data.id
        }
        const currentConversationId = conversationId || newId;
        // ✅ 一次性加入用户 + AI占位
        setMessage(prev => [
            ...prev,
            { role: 'user', content: userMsg },
            { role: 'assistant', content: "" }
        ])

        setSay("")
        // console.log(message);

        const response = await fetch('http://localhost:3000/api/ai/aiChat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMsg, conversationId: currentConversationId, userId: userId })
        })

        const reader = response.body?.getReader()
        if (!reader) {
            console.error("reader不存在")
            return
        }

        const decoder = new TextDecoder()

        let done = false
        let aiText = ""
        let buffer = "" // ⭐关键：缓存未处理的数据

        while (!done) {
            const { value, done: doneReading } = await reader.read()
            done = doneReading

            // ⭐ 防止中文乱码 + 支持流
            buffer += decoder.decode(value, { stream: true })

            // ⭐ 按完整事件切割
            const parts = buffer.split(/\n\n|\r\n\r\n/)

            // ⭐ 最后一个可能是不完整的，留着
            buffer = parts.pop() || ""

            for (const part of parts) {
                if (part.startsWith("data: ")) {
                    const data = part.replace("data: ", "").trim()
                    // console.log(data);

                    if (data === "[DONE]") {
                        setstart(false)
                        return
                    }

                    try {
                        const parsed = JSON.parse(data)
                        // console.log(parsed);

                        const content = parsed || ""

                        aiText += content
                        console.log('aaaa', content);
                    } catch (e) {
                        console.error("解析失败", data, e)
                    }

                    // ✅ 实时更新UI
                    setMessage(prev => {
                        const newArr = [...prev]
                        newArr[newArr.length - 1] = {
                            role: "assistant",
                            content: aiText
                        }
                        return newArr
                    })
                }
            }
        }
    }

    return <section className='chatView'>
        {start && <h2> 今天要学习什么 </h2>}
        {!start &&
            <div className='msgList'>
                {message.map((msg, index) => (
                    <div key={index} className="message">
                        {msg.role === "assistant" ? (
                            <div className="markdown prose prose-sm dark:prose-invert max-w-none text-left">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <span className='useMsg'>{msg.content}</span>
                        )}

                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        }
        <div className='inputDiv'>
            <button className='file'>✚</button>
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
                    <path
                        d="M5 12h14M13 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg></button>
        </div>
    </section>
}
