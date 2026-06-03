import { useState } from "react";
import { useNavigate } from "react-router-dom";
import request from "../../utils/request";
import "./login.css";

export function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    async function handleRegister(
        e: React.FormEvent
    ) {

        e.preventDefault();

        if (!username || !password || !confirm) {

            alert("请填写完整信息");
            return;

        }

        if (password !== confirm) {

            alert("两次密码不一致");
            return;

        }

        try {

            await request.post(
                "/user/register",
                {
                    username,
                    password
                }
            );

            alert("注册成功");

            navigate("/login");

        } catch (err: any) {

            alert(
                err.response?.data?.message
                || "注册失败"
            );

        }

    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>注册</h2>

                <form onSubmit={handleRegister}>
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

                    <input
                        className="auth-input"
                        type="password"
                        placeholder="确认密码"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />

                    <button className="auth-button" type="submit">
                        注册
                    </button>
                </form>

                <p className="auth-link" onClick={() => navigate("/login")}>
                    已有账号？去登录
                </p>
            </div>
        </div>
    );
}