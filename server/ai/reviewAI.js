import express from 'express'
import OpenAI from 'openai'
import dotenv from "dotenv"
import db from "../db/index.js"
import z from "zod"
import { v4 as uuidv4 } from "uuid";
dotenv.config()
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
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
function getNextReview(score) {

    const date = new Date()

    if (score >= 90) {
        date.setDate(date.getDate() + 7)
    }
    else if (score >= 75) {
        date.setDate(date.getDate() + 3)
    }
    else {
        date.setDate(date.getDate() + 1)
    }

    return date
}
function getStatus(score, reviewCount) {

    if (score >= 90 && reviewCount >= 5) {
        return "mastered"
    }

    if (reviewCount === 0) {
        return "new"
    }

    return "reviewing"
}
const ReviewRouter = express.Router()

ReviewRouter.post('/program/:id', async (req, res) => {
    try {
        const { id } = req.params

        const search = await db.query(
            `SELECT * FROM knowledge_mastery WHERE id=$1`,
            [id]
        )
        const knowledge = search.rows[0]
        console.log(knowledge);
        const mastery = knowledge.mastery
        const reviewCount = knowledge.review_count || 0
        let difficulty = "基础"
        let questionCount = 5

        if (mastery < 40) {
            difficulty = "简单"
            questionCount = 10
        }
        else if (mastery < 80) {
            difficulty = "中等"
            questionCount = 7
        }
        else {
            difficulty = "困难"
            questionCount = 5
        }
        const prompt = `
你是一名严格的学习辅导出题系统（Exam Generator）。

## 知识信息
知识内容：
${knowledge.knowledge_name}

用户掌握度：
${mastery}

复习次数：
${reviewCount}

## 出题要求
请根据掌握度生成 ${questionCount} 道 ${difficulty} 难度的复习题。

## 题型要求（必须满足）
题目必须包含以下三种类型，并按比例分配：

- choice（选择题） 40%
- fill（填空题） 30%
- qa（简答题） 30%

## 严格返回格式（非常重要）

必须只返回 JSON 数组，不要任何解释、不要 markdown、不要代码块。

格式如下：

[
  {
    "type": "choice",
    "question": "题干",
    "options": ["A", "B", "C", "D"],
    "answer": "A"
  },
  {
    "type": "fill",
    "question": "题干中包含空格_____",
    "answer": "标准答案"
  },
  {
    "type": "qa",
    "question": "问答题题干",
    "answer": "标准参考答案"
  }
]

## 约束规则

1. choice 类型必须包含 options（4个选项）
2. answer 必须是正确选项或标准答案
3. fill 题必须包含明确空格 "_____"
4. qa 必须是理解/解释类问题
5. 不允许重复题目
6. 必须围绕知识点出题
7. 不允许输出 JSON 以外任何内容
8. 不要使用 markdown，不要用代码块

`
        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: 'system', content: prompt },
                {
                    role: 'user',
                    content: `


知识点：
${JSON.stringify(knowledge.knowledge_name)}

                `

                }
            ]
        })
        const reply = parseIfJson(result.choices[0].message.content)
        console.log(reply);

        res.json({ data: reply })

    } catch (error) {
        console.log(error);
        res.json({ data: 'ai error' })
    }
})
ReviewRouter.post('/answer', async (req, res) => {
    try {


        const { questions, answers, knowledgeId } = req.body
        console.log(knowledgeId);
        const data = questions.map((q, index) => ({
            question: q.question,
            standardAnswer: q.answer,
            userAnswer: answers[index] || ""
        }))
        const prompt = `
你是一名专业学习评估老师。

请逐题评价用户答案。

评分规则：

100分：
答案完整准确。

80分：
核心概念正确，但细节缺失。

60分：
理解部分正确。

40分以下：
理解错误或内容严重缺失。

请对每一道题单独评分。

只返回JSON。

格式：

[
  {
    "question":"题目",
    "score":90,
    "feedback":"评价"
  }
]
`

        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: 'system', content: prompt },
                {
                    role: 'user',
                    content: `
             题目数据：

${JSON.stringify(data)}
                `

                }
            ]
        })
        const reply = parseIfJson(result.choices[0].message.content)
        const total = reply.reduce((sum, item) => sum + item.score, 0)

        const avg = Math.round(total / reply.length)
        const search = await db.query(
            `SELECT * FROM knowledge_mastery WHERE id=$1`,
            [knowledgeId]
        )
        const knowledge = search.rows[0]
        console.log(knowledge);
        console.log(avg);

        const nextReviewAt = getNextReview(avg)

        const status =
            getStatus(
                avg,
                knowledge.review_count
            )

        await db.query(
            `
    UPDATE knowledge_mastery
    SET
        review_count = review_count + 1,
        mastery = $1,
        last_review_time = NOW(),
        next_review_time = $2,
        status = $3
    WHERE id = $4
    `,
            [
                avg,
                nextReviewAt,
                status,
                knowledgeId
            ]
        )
        res.json({
            data: {
                avg: avg,
                nextReviewAt,
                details: reply
            }
        })
    } catch (error) {
        console.log(error);

    }
})
export default ReviewRouter