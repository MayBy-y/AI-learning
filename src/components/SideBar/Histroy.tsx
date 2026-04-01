import './sideHead.css'
import { useState } from 'react'
export function HistroyTalk() {
    const [open, setOpen] = useState(true)
    function toggle() {
        setOpen(!open)
    }
    const list: string[] = ['简约emoji推荐', '第二个项目方向', '快速学习agent']
    return <>

        <div className='histroy'>
            <div className='expand'>
                <span>历史聊天</span>
                {open && <button onClick={toggle}>﹀</button >}
                {!open && <button onClick={toggle}>〉</button >}
            </div>
            {open && <ul >
                {list.map((item) => <li key={item}>{item}</li>)}
            </ul>}
        </div>
    </>
}