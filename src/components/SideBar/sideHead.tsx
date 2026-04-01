import './sideHead.css'
import { Menu } from "lucide-react";
type onClickProps = {
    onClick: () => void
}
export function TopBar({ onClick }: onClickProps) {
    return <>
        <section className='leftBody'>
            <img className="logo" src="../../public/hello.jpg" alt="" />
            <button className='clickUp' onClick={onClick}><Menu size={24} /></button>
        </section>
    </>
}
export function MoreOptions() {
    const choosen: string[] = ['💬 开始新聊天', '📊 规划新目标', '📈 智能复习本', '📁 查询知识库']
    return <>
        <section className='chooseOptions'>
            {choosen.map((item) => <li key={item} className='smallOption'>{item}</li>)}
        </section>
    </>
}
