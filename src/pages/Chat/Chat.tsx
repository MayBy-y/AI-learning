import './Chat.css'
import { TopChat } from './ChatTop'
import { ChatView } from './ChatTop'
import { SideBar } from '../../components/SideBar/SideBar'
import { useState, useEffect } from 'react'

export function Chat() {
    const [open, setOpen] = useState(true)
    const [start, setStart] = useState<boolean>(true)
    const [conversationId, setConversationId] = useState<string>('')
    const [message, setMessage] = useState<any[]>([])
    function openOr() {
        setOpen(!open)
    }
    function openStart() {
        setStart(prev => !prev);
    }
    function setisOpen(item: boolean) {
        setStart(item)
    }
    useEffect(() => {
        console.log("conversationId 变了：", conversationId);
    }, [conversationId]);
    return <>
        <SideBar
            isOpen={open}
            onClick={openOr}
            setStart={openStart}
            setConversationId={setConversationId}
            setmessage={setMessage}
            setOpen={setisOpen}
        />
        <section className='Chat'>
            <TopChat />
            <ChatView
                start={start}
                setstart={setisOpen}
                conversationId={conversationId}
                setConversationId={setConversationId}
                message={message}
                setMessage={setMessage}
            />
        </section>
    </>
}