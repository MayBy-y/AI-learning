import './sideHead.css'
import { Menu } from "lucide-react";
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate()
    // const choosen: string[] = [ '💬 开始新聊天','📊 规划新目标', '📈 智能复习本', '📁 查询知识库']
    return <>
        <section className='chooseOptions'>
            <li className='smallOption' >{'💬 开始新聊天'}</li>
            <li className='smallOption' onClick={() => { navigate('/plan') }}> {'📊 规划新目标'} </li>
            <li className='smallOption'> {'📈 智能复习本'} </li>
            <li className='smallOption' onClick={() => { navigate('/konwledge') }}> {'📁 查询知识库'} </li>

            {/* {choosen.map((item) => <li key={item} className='smallOption'>{item}</li>)} */}
        </section>
    </>
}
