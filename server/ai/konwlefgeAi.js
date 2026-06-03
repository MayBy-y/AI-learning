import express from 'express'
import OpenAI from 'openai'
import dotenv from "dotenv"
import db from '../db/index.js'
dotenv.config()
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
const knowledgeAiRouter = express.Router()
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
knowledgeAiRouter.post('/summarize/:id', async (req, res) => {
    try {
        const { id } = req.params
        const sereach = await db.query(
            `
    SELECT *
    FROM knowledge
    WHERE id=$1
    `,
            [id]
        )

        if (sereach.rows.length === 0) {
            return res.status(404).json({
                message: "文章不存在"
            })
        }

        const article = sereach.rows[0]
        console.log('kaishi ');

        const prompt = `
    你是一个知识整理AI，请对以下Markdown内容进行分析并输出JSON：

必须严格返回JSON，不要多余文字：
 
{
  "summary": "",
  "keyPoints": [],
  "tags": [],
  "title": "",
  "category": "",
  "difficulty": "easy | medium | hard"
}

规则：
- summary：2~3句话
- keyPoints：3~6条
- tags：3~5个关键词
- category：技术分类（如 Vue / Node / Algorithm / System Design）
- difficulty：根据内容判断

知识库标题：
${article.title}

Markdown内容：
${article.content}

知识库标签：
${article.tags}
`
        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: "system", content: "你是严格JSON输出的知识整理AI" },
                { role: "user", content: prompt }
            ]
        });
        console.log(result.choices[0].message.content);

        const reply = parseIfJson(result.choices[0].message.content)

        //存入数据库
        await db.query(
            `
UPDATE knowledge
SET

summary=$1,

key_points=$2,

ai_tags=$3,

ai_title=$4,

category=$5

WHERE id=$6
`,
            [
                reply.summary,

                JSON.stringify(reply.keyPoints),

                JSON.stringify(reply.tags),

                reply.title,

                reply.category,

                id
            ]
        )
        res.json({ code: 200, data: reply })
    }
    catch (error) {
        console.log(error);

    }
})

export default knowledgeAiRouter