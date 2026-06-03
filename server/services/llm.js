import OpenAI from 'openai'
import dotenv from "dotenv"
dotenv.config()
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
export async function callLLM({ system, user, message, stream = true }) {
    const finalMessage = [{
        role: "system",
        content: system
    }]
    if (message) {
        finalMessage.push(...message)
    }
    if (user) {
        finalMessage.push({
            role: 'user',
            content: user
        })
    }
    // console.log(finalMessage);
    // console.log(stream);

    const res = await client.chat.completions.create({
        model: "qwen-turbo",
        messages: finalMessage,
        stream
    })
    if (stream) return res

    return res.choices[0].message.content
}