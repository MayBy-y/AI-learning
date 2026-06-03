import { useEffect, useState } from "react";
import request from "../../utils/request.js";
import './login.css'
interface User {
    id: number;
    username: string;
}

export function UserProfile() {

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        getUser();
    }, []);

    async function getUser() {

        try {

            const res = await request.get("/user/me");

            setUser(res.data.user);

        } catch (err) {

            console.log(err);

        }

    }

    if (!user) {

        return <div>加载中...</div>;

    }

    return (

        <div className="userCard">

            <div className="avatar">
                {user.username[0].toUpperCase()}
            </div>

            <div className="userMeta">

                <h3>{user.username}</h3>

                <p>欢迎回来，继续今天的学习</p>

            </div>

        </div>
    );

}