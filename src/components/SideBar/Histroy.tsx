import './sideHead.css'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import request from '../../utils/request';
interface list {
    created_at: string,
    id: string,
    title: string,
    updated_at: string,
    user_id: number
}
type headProps = {
    setmessage: React.Dispatch<React.SetStateAction<any[]>>;
    setConversationId: React.Dispatch<React.SetStateAction<string>>;
    setisOpen: (item: boolean) => void
}
export function HistroyTalk({ setmessage, setisOpen, setConversationId }: headProps) {
    const [open, setOpen] = useState(true)
    const [chatlist, setChatList] = useState<list[]>([])
    function toggle() {
        setOpen(!open)
    }
    async function getList() {
        const user = await request.get("/user/me")
        const userId = user.data.user.id
        const res = await request.get(`/ai/chatList/${userId}`)
        console.log(res.data.data);
        setChatList(res.data.data)

    }
    async function handleDelete(id: string) {
        await request.delete(`/ai/delete/${id}`)
        getList()
    }
    async function getHistory(id: string) {
        setConversationId(id)
        const result = await request.get(`/ai/message/${id}`)
        console.log(result.data.data);
        setmessage(result.data.data)
        setisOpen(false)
    }
    useEffect(() => {
        getList()
    }, [])
    return <>

        <div className='histroy'>
            <div className='expand'>
                <span>历史聊天</span>
                {open && <button onClick={toggle}><ChevronDown size={18} /></button >}
                {!open && <button onClick={toggle}><ChevronUp size={18} /></button >}
            </div>
            {open && <ul>
                {chatlist.map((item) =>
                    <li key={item.id}
                        className="chat-item"

                    > <span onClick={() => getHistory(item.id)}>{item.title}</span>
                        <Trash2
                            size={16}
                            className="delete-icon"
                            onClick={(e) => {
                                handleDelete(item.id)
                                e.stopPropagation();
                            }}
                        /></li>)}
            </ul>}
        </div>
    </>
}