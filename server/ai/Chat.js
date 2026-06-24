import express from "express"
import OpenAI from 'openai'
import dotenv from "dotenv"
import db from "../db/index.js"
import { runAgent } from "../agent/index.js"
dotenv.config()
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
const ChatRouter = express.Router()
function parseIfJson(str) {
    if (typeof str !== "string") return str;

    try {
        const cleanStr = str
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(cleanStr);
    } catch {
        return str;
    }
}
ChatRouter.post('/aiChat', async (req, res) => {
    try {
        const { message, conversationId, userId } = req.body
        console.log('conversationId=', conversationId);

        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        if (!message) return res.status(400).json({ error: "message不能为空" })
        //存用户消息
        await db.query(
            `INSERT INTO messages (conversation_id, role, content)
            VALUES ($1, $2, $3)`,
            [conversationId, 'user', message]
        )
        //读取历史消息
        const historyList = await db.query(
            `SELECT role, content
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
            [conversationId]
        )

        const history = historyList.rows
        if (history.length === 1) {
            const prompt = `
请根据用户问题生成一个简短标题（10字以内）：

问题：${message}
只返回标题，不要解释
`;
            const result = await client.chat.completions.create({
                model: "qwen-turbo",
                messages: [
                    { role: 'system', content: prompt },
                    {
                        role: 'user',
                        content: `${message}`

                    }
                ]
            })
            const reply = parseIfJson(result.choices[0].message.content)
            // console.log('title=', reply);
            await db.query(
                `UPDATE conversations
   SET title = $1
   WHERE id = $2`,
                [reply, conversationId]
            );
        }
        // console.log('history=', history);
        //要调用工具的话，先非流式获得ai的回答
        const stream = await runAgent(message, history, userId)
        // console.log(stream);

        let fullReply = ''
        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content
            if (content) {
                // console.log(content);

                fullReply += content
                res.write(`data: ${JSON.stringify(content)}\n\n`)
            }
        }
        // const reply = response.choices[0].message.content
        // console.log(fullReply);
        await db.query(
            `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, $2, $3)`,
            [conversationId, 'assistant', fullReply]
        )
        // messages.push({
        //     role: "assistant",
        //     content: fullReply
        // })

        res.write(`data: [DONE]\n\n`)
        res.end()
    } catch (error) {
        console.error(error)

        // SSE里不要 res.json（会破流）
        res.write(`data: ${JSON.stringify({ error: "AI调用失败" })}\n\n`)
        res.write(`data: [DONE]\n\n`)
        res.end()
    }

})
//存用户消息


//开始新对话
ChatRouter.post('/create', async (req, res) => {
    try {
        const { userId } = req.body
        const result = await db.query(
            `
    INSERT INTO conversations
    (user_id,title)
    VALUES($1,$2)
    RETURNING *
    `,
            [userId, '新对话']
        )
        res.send(result.rows[0])
    } catch (error) {
        console.log(error)
    }
})
//获取对话列表
ChatRouter.get('/chatList/:userId', async (req, res) => {
    const { userId } = req.params
    const result = await db.query(
        `SELECT *
FROM conversations
WHERE user_id=$1
ORDER BY updated_at DESC
`,
        [userId]
    )
    console.log(result);

    const list = result.rows
    res.json({ code: 200, data: list })

})
//删除对话
ChatRouter.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params
        await db.query(`
            DELETE FROM messages
WHERE conversation_id=$1
            `,
            [id])
        await db.query(`
            DELETE FROM conversations
WHERE id=$1
            `,
            [id])
        res.json({ code: 200, data: '删除成功' })
    } catch (error) {
        console.log(error);

    }
})
//获取messages
ChatRouter.get('/message/:id', async (req, res) => {
    try {
        const { id } = req.params
        const result = await db.query(`
            SELECT *
FROM messages
WHERE conversation_id=$1
ORDER BY created_at ASC
            `,
            [id])
        const reply = result.rows
        console.log(reply);

        res.json({ code: 200, data: reply })
    } catch (error) {
        console.log(error);

    }
})
export default ChatRouter