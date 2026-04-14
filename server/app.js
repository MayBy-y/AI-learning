import express from "express"
import pool from "./db/index.js"
import ChatRouter from "./ai/Chat.js"
import cors from "cors"
const app = express()
app.use(cors())
app.get("/users", async (req, res) => {
    const result = await pool.query("SELECT * FROM users")
    console.log('数据库已连接');

    res.json(result.rows)
})


//挂载聊天agent

app.use('/api/ai', ChatRouter)
app.listen(3000, () => {
    console.log("server running")
})