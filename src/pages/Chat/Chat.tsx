import './Chat.css'
import { TopChat } from './ChatTop'
import { ChatView } from './ChatTop'
import { SideBar } from '../../components/SideBar/SideBar'
import { useState } from 'react'
export function Chat() {
    const [open, setOpen] = useState(true)
    function openOr() {
        setOpen(!open)
    }
    return <>
        <SideBar isOpen={open} onClick={openOr} />
        <section className='Chat'>
            <TopChat />
            <ChatView />
        </section>
    </>
}