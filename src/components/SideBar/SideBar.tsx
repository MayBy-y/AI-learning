import { TopBar } from "./sideHead";
import { MoreOptions } from "./sideHead";
import { HistroyTalk } from "./Histroy";
import { Menu } from "lucide-react";
import './sideHead.css'
type SideBarProps = {
    isOpen: boolean
    onClick: () => void
}
export function SideBar({ isOpen, onClick }: SideBarProps) {
    return <>
        <section className={`leftSection ${isOpen ? "open" : "close"}`}>
            <TopBar onClick={onClick} />
            <MoreOptions />
            <HistroyTalk />
        </section>
        {!isOpen && <button className='clickUp' onClick={onClick}><Menu size={24} /></button>}
    </>
}