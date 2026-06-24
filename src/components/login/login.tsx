import { useState } from "react";
import { useNavigate } from "react-router-dom";
import request from "../../utils/request";
import "./login.css";
export function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin(
        e: React.FormEvent
    ) {

        e.preventDefault();

        if (!username || !password) {

            alert("请输入用户名和密码");

            return;

        }

        try {

            const res =
                await request.post(
                    "/user/login",
                    {
                        username,
                        password
                    }
                );
            localStorage.setItem(
                "token",
                res.data.token
            );
            const result =
                await request.get("/user/me")

            console.log(result.data)

            alert("登录成功");

            navigate("/");

        } catch (err: any) {
            console.log(err);

            alert(
                err.response?.data?.message
                || "登录失败"
            );

        }

    }
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>登录</h2>

                <form onSubmit={handleLogin}>
                    <input
                        className="auth-input"
                        type="text"
                        placeholder="用户名"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                        className="auth-input"
                        type="password"
                        placeholder="密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button className="auth-button" type="submit">
                        登录
                    </button>
                </form>

                <p className="auth-link" onClick={() => navigate("/register")}>
                    没有账号？去注册
                </p>
            </div>
        </div>
    );
}