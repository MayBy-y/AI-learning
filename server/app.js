import express from "express"
import pool from "./db/index.js"
import dotenv from "dotenv"
import ChatRouter from "./ai/Chat.js"
import PlanRouter from "./ai/Plan.js"
import konwRouter from "./routes/konwledge.js"
import knowledgeAiRouter from "./ai/konwlefgeAi.js"
import userRouter from './routes/login.js'
import ReviewRouter from "./ai/reviewAI.js"
import cors from "cors"
dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
//开放静态目录
app.use(

    "/uploads",

    express.static(

        "uploads"

    )

)
app.get("/users", async (req, res) => {
    const result = await pool.query("SELECT * FROM users")
    console.log('数据库已连接');

    res.json(result.rows)
})


//挂载聊天agent
app.use("/api/user", userRouter)
app.use('/api/ai', ChatRouter)
app.use('/api/ai', PlanRouter)
app.use('/api/knowledge', konwRouter)
app.use('/api/knowAi', knowledgeAiRouter)
app.use('/api/review', ReviewRouter)
app.listen(3000, () => {
    console.log("server running")
})