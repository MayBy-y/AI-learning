
import request from '../../utils/request';
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
type headProps = {
    setStart: () => void
    setConversationId: React.Dispatch<React.SetStateAction<string>>;
}
export function MoreOptions({ setStart, setConversationId }: headProps) {
    console.log(setStart);
    const navigate = useNavigate()
    async function openNew() {
        const user = await request.get("/user/me")
        const userId = user.data.user.id
        const res = await request.post('/ai/create', { userId: userId })
        console.log(res.data);
        setConversationId(res.data.id)
        setStart()

    }
    return <>
        <section className='chooseOptions'>
            <li className='smallOption' onClick={() => { openNew() }} >{'💬 开始新聊天'}</li>
            <li className='smallOption' onClick={() => { navigate('/plan') }}> {'📊 规划新目标'} </li>
            <li className='smallOption' onClick={() => { navigate('/review') }} > {'📈 智能复习本'} </li>
            <li className='smallOption' onClick={() => { navigate('/konwledge') }}> {'📁 查询知识库'} </li>

            {/* {choosen.map((item) => <li key={item} className='smallOption'>{item}</li>)} */}
        </section>
    </>
}
