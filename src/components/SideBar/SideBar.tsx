import { TopBar } from "./sideHead";
import { MoreOptions } from "./sideHead";
import { HistroyTalk } from "./Histroy";
import { Menu } from "lucide-react";
import './sideHead.css'
type SideBarProps = {
    isOpen: boolean
    onClick: () => void
    setStart: () => void
    setConversationId: React.Dispatch<React.SetStateAction<string>>;
    setmessage: React.Dispatch<React.SetStateAction<any[]>>;
    setOpen: (item: boolean) => void
}
export function SideBar({ isOpen, onClick, setStart, setConversationId, setmessage, setOpen }: SideBarProps) {
    return <>
        <section className={`leftSection ${isOpen ? "open" : "close"}`}>
            <TopBar onClick={onClick} />
            <MoreOptions setStart={setStart} setConversationId={setConversationId} />
            <HistroyTalk setConversationId={setConversationId} setmessage={setmessage} setisOpen={setOpen} />
        </section>
        {!isOpen && <button className='clickUp' onClick={onClick}><Menu size={24} /></button>}
    </>
}