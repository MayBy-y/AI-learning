import express from "express"
import OpenAI from 'openai'
import dotenv from "dotenv"
import { runAgent } from "../agent/index.js"
dotenv.config()
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
const ChatRouter = express.Router()

ChatRouter.post('/aiChat', async (req, res) => {
    try {
        const { message, messages } = req.body
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        if (!message) return res.status(400).json({ error: "message不能为空" })
        messages.push({
            role: "user",
            content: message
        })
        //要调用工具的话，先非流式获得ai的回答
        const stream = await runAgent(message, messages)
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

        messages.push({
            role: "assistant",
            content: fullReply
        })

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
export default ChatRouter