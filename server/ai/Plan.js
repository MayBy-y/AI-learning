import express from "express"
import OpenAI from 'openai'
import dotenv from "dotenv"
import db from "../db/index.js"
import z from "zod"
import { analyzeStudyData, deriveLearningState } from "../utils/analyzeStudy.js"
import { v4 as uuidv4 } from "uuid";
dotenv.config()
const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
//进行schema类型验证，如果返回数据不符合自动报错
const splitTaskSchema = z.array(
    z.object({
        content: z.string(),
        estimatedMinutes: z.number(),
        difficulty: z.enum(["easy", "medium", "hard"])
    })
)
//处理json字符串
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
const PlanRouter = express.Router()
//规划大致任务
PlanRouter.post('/plan', async (req, res) => {
    try {
        const { goal, time, usersid } = req.body
        const planId = uuidv4()
        //把目标和学习时间存入数据库
        const planResult = await db.query(
            `
INSERT INTO study_plans
(id,user_id,goal,study_time)
VALUES($1,$2,$3,$4)
RETURNING id
`,
            [
                planId,
                usersid,
                goal,
                time
            ]
        )
        console.log(planResult);

        const planPropmt = `
你是一个专业的学习规划助手。

你的任务：
根据用户目标生成学习计划。

你必须遵守以下规则：

1. 只能返回合法 JSON
2. 最外层必须是 JSON 数组 []
3. 不允许返回 markdown
4. 不允许返回 \`\`\`json
5. 不允许输出解释
6. 不允许输出额外文字
7. 所有字段必须完整
8. task 类型必须包含 done 字段

返回格式示例：

[
  {
    "id": "1",
    "type": "title",
    "content": "阶段一：入门"
  },
  {
    "id": "2",
    "type": "task",
    "content": "学习 TS 基础类型",
    "done": false
  }
]

用户目标：
${goal}

学习时间：
${time}
`
        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: "system", content: "你是学习规划助手" },
                { role: "user", content: planPropmt }
            ]
        })
        console.log(result.choices[0].message.content);
        const raw = result.choices[0].message.content
        const clean = parseIfJson(raw)
        //计入数据库
        for (const item of clean) {
            await db.query(
                `
   INSERT INTO study_tasks
   (
      plan_id,
      type,
      content,
      status
   )
   VALUES
   (
      $1,
      $2,
      $3,
      $4
   )
   `,
                [
                    planId,
                    item.type,
                    item.content,
                    "todo"
                ]
            )
        }
        res.json({
            code: 200, data:
            {
                clean,
                id: planId
            }
        })
    } catch (error) {
        console.log(error);
    }
})
//细分每日任务
PlanRouter.post('/dailyPlan', async (req, res) => {
    try {
        const { list, goal, planId, userId } = req.body
        const propmt = `
  你是一个现实主义学习规划助手。

你的任务：
根据用户的【总体学习计划】，
生成【仅今天需要完成】的学习计划。

你必须优先考虑：
- 用户真实学习能力
- 学习可持续性
- 今日可执行性
- 用户当前学习阶段

必须遵守以下规则：

1. 只生成“今天”的学习任务
2. 不要生成多天计划
3. 每天最多安排 2~4 个任务
4. 每个任务控制在 30~90 分钟
5. 必须循序渐进
6. 不要生成理想化计划
7. 不要假设用户全天学习
8. 如果任务较复杂，自动拆分成小步骤
9. 优先安排当前阶段最重要的内容
10. 不要重复任务
11. 内容必须简洁明确
12. 必须贴合用户当前学习阶段
13. 不要生成已经明显超出当前阶段的内容
14. 任务必须真正帮助用户推进整体目标

任务要求：

1. 明确今天要完成什么
2. 每个任务必须具体
3. 不要输出空话
4. 不要输出解释
5. 不要输出 markdown
6. 不要输出 \`\`\`
7. 只返回合法 JSON 数组
8. 最外层必须是 []

返回格式：

[
  {
    "id": "1",
    "type": "title",
    "content": "今日学习计划"
  },
  {
    "id": "2",
    "type": "task",
    "content": "学习 TypeScript 基础类型",
    "status": "todo",
    "estimatedMinutes": 45,
    "difficulty": "easy"
  }
]

字段规则：

- id: string
- type: "title" | "task"

task 额外字段：
- status: "todo"
- estimatedMinutes: number
- difficulty: "easy" | "medium" | "hard"

用户总体学习计划：

${list}

用户学习目标：

${goal}    `

        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: "system", content: "你是学习规划助手" },
                { role: "user", content: propmt }
            ]
        })
        // console.log(result.choices[0].message.content);
        const raw = result.choices[0].message.content
        const clean = raw.replace(/```json|```/g, "").trim()
        let parsed = parseIfJson(clean)
        console.log(parsed)
        console.log(planId)
        const today = new Date()
            .toISOString()
            .split('T')[0]
        const dailyPlanResult =
            await db.query(
                `
INSERT INTO daily_plans
(
    id,
    user_id,
    plan_id,
    plan_date
)
VALUES
(
    $1,$2,$3,$4
)
RETURNING id
`,
                [
                    uuidv4(),
                    userId,
                    planId,
                    today
                ]
            )

        const dailyPlanId = dailyPlanResult.rows[0].id
        for (const item of parsed) {
            const taskId = uuidv4()
            if (item.type !== "task") continue
            item.dailyId = taskId
            await db.query(
                `
    INSERT INTO daily_tasks
    (
        id,
        daily_plan_id,
        content,
        status,
        estimated_minutes,
        difficulty,
        type
    )
    VALUES
    (
        $1,$2,$3,$4,$5,$6,$7
    )
    `,
                [
                    taskId,
                    dailyPlanId,
                    item.content,
                    "todo",
                    item.estimatedMinutes,
                    item.difficulty,
                    item.type
                ]
            )


        }
        res.json({
            code: 200,
            dailyPlanId,
            data: parsed
        })
    } catch (error) {
        console.log(error);

    }
})
//拆分任务
PlanRouter.post('/splitTask', async (req, res) => {
    try {
        const { task } = req.body;
        const splitPrompt = `
你是学习规划助手。

用户会给你一个学习任务。

请把任务拆解为 3~6 个：
- 更小
- 可执行
- 有顺序
- 适合直接开始完成

拆解要求：
1. 仅返回 JSON 数组
2. 不要解释
3. 每一步必须是具体可执行动作
4. 单步预计 10~30 分钟可完成
5. 避免抽象/空泛描述
6. 按学习顺序排列
7. 不要重复原任务表述

返回格式要求：
1. 仅返回合法 JSON 数组
2. 不要输出 Markdown
3. 不要输出解释性文字
4. 所有 key 必须使用双引号

字段：
- content: string
- estimatedMinutes: number
- difficulty:"easy" | "medium" | "hard"

示例：

输入：
学习 React Hooks

输出：
[
   {
        "content":"理解 useState",
        "estimatedMinutes": 5,
        "difficulty": "easy"
    },
    {
        "content": "理解 useEffect",
        "estimatedMinutes": 5,
        "difficulty": "easy"
    },
    {
        "content": "理解 useMemo / useCallback",
        "estimatedMinutes": 10,
        "difficulty": "medium"
    },
    {
        "content":完成 Hooks Demo"
        "estimatedMinutes": 20,
        "difficulty": "hard"
    }
]
`;
        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: "system", content: splitPrompt },
                { role: "user", content: task }
            ]
        })
        let reply = parseIfJson(result.choices?.[0]?.message?.content)


        res.json({ data: reply })
    } catch (error) {

    }
})
//推荐下一步任务
PlanRouter.post('/nextStep', async (req, res) => {
    try {
        const { allTasks, completedTask } = req.body

        /**
         * 1. 过滤掉已完成 & 当前任务
         */
        const candidates = allTasks.filter((t) => {
            return t.status !== 'done' && t.id !== completedTask?.id
        })

        /**
         * 2. 后端基础评分（减少AI负担）
         */
        const scoredTasks = candidates.map((t) => {
            let score = 0

            // 基础任务优先
            score += (5 - (t.depth ?? 3)) * 2

            // 越短越优先
            if ((t.estimatedMinutes ?? 60) <= 30) score += 2

            // 如果有依赖字段（可选扩展）
            if (t.dependsOn?.includes(completedTask?.id)) {
                score += 5
            }

            return {
                ...t,
                score
            }
        })

        /**
         * 3. 排序（最重要信号放前面）
         */
        const sortedCandidates = scoredTasks
            .sort((a, b) => b.score - a.score)
            .slice(0, 5) // 🔥 控制AI输入规模（关键优化）

        /**
         * 4. 精简 Prompt（让AI只做选择，不做推理）
         */
        const nextPropmt = `
你是一个“任务选择器AI”。

你的唯一任务：
👉 从候选任务中选出 1 个最合适的任务

---

【刚完成的任务】
${JSON.stringify(completedTask, null, 2)}

---

【候选任务（已按优先级排序，越靠前越优先）】
${JSON.stringify(sortedCandidates, null, 2)}

---

【规则】
1. 只能从候选任务中选择，不能编造
2. 不能选择 status = done 的任务
3. 不能选择刚完成的任务
4. 优先选择靠前任务（非常重要）
5. 只输出一个任务

---

【输出必须严格 JSON，不允许任何多余内容】

格式：
{
  "nextTaskId": "string",
  "content": "string",
  "reason": "一句话说明为什么选择它",
  "confidence": 0.0
}
`

        /**
         * 5. 调用模型
         */
        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                {
                    role: "system",
                    content: nextPropmt
                },
                {
                    role: "user",
                    content: "请从候选任务中选择最合适的下一个任务"
                }
            ],
            temperature: 0.2, // 🔥 降低随机性（非常关键）
        })

        const content = result.choices?.[0]?.message?.content || "{}"

        /**
         * 6. 更安全 JSON 解析
         */
        let reply = parseIfJson(content)

        return res.json({
            data: reply
        })

    } catch (error) {
        console.error(error)
        res.json({
            data: null,
            error: 'ai error'
        })
    }
})
//ai学习结果总结
PlanRouter.post('/result', async (req, res) => {
    try {
        const { taskList, dailyPlanId, planId, usersId } = req.body
        //根据任务列表得到的学习数据
        console.log(taskList);
        for (const task of taskList) {

            await db.query(
                `
    UPDATE daily_tasks
    SET
        status=$1,
        during_time=$2,
        pause_count=$3
    WHERE id=$4
    `,
                [
                    task.status,
                    task.duringTime,
                    task.pauseCount,
                    task.dailyId
                ]
            )
        }
        const newList = taskList
            .filter(item => item.type === 'task')
            .map(item => ({
                ...item,
                duringTime: item.duringTime / 60
            }))
        console.log(newList);

        const analysisData = analyzeStudyData(newList)
        console.log(analysisData);

        //计算得到学习状态
        const learningState =
            deriveLearningState(analysisData)
        console.log(learningState);

        const resultPropmt = `
你是一个学习行为分析 AI。

请基于提供的学习数据：

完成：

1. 总结用户学习状态
2. 分析用户学习习惯
3. 找出主要困难点
4. 判断是否存在学习压力
5. 给出明日可执行建议

要求：

1. 必须基于数据分析
2. 禁止空话
3. 禁止鼓励式废话
4. 建议必须具体
5. 如果学习压力高，必须提醒

返回 JSON：

{
  "summary":"",
  "strengths":[],
  "weaknesses":[],
  "tomorrowFocus":[]
}
    `
        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: "system", content: resultPropmt },
                {
                    role: "user",
                    content: `学习分析数据：

${JSON.stringify(analysisData, null, 2)}

学习状态：

${JSON.stringify(learningState, null, 2)}


请输出JSON分析`
                }
            ]
        })
        console.log(result.choices[0].message.content);

        const reply = parseIfJson(result.choices[0].message.content)
        await db.query(
            `
INSERT INTO study_reports
(
    id,

    user_id,
    plan_id,

    report_date,

    total_study_time,
    completion_rate,
    overtime_rate,
    average_task_time,

    learning_state,
    fatigue_level,
    focus_level,

    summary,
    strengths,
    weaknesses,
    tomorrow_focus
)
VALUES
(
    gen_random_uuid(),

    $1,
    $2,

    CURRENT_DATE,

    $3,
    $4,
    $5,
    $6,

    $7,
    $8,
    $9,

    $10,
    $11,
    $12,
    $13
)
`,
            [
                usersId,
                planId,

                analysisData.totalStudyTime,
                analysisData.completionRate,
                analysisData.overtimeRate,
                analysisData.averageTaskTime,

                learningState.executionLevel,
                learningState.fatigueLevel,
                learningState.focusLevel,

                reply.summary,

                JSON.stringify(reply.strengths),
                JSON.stringify(reply.weaknesses),
                JSON.stringify(reply.tomorrowFocus)
            ]
        )
        res.json({
            data: {
                totalStudyTime: analysisData.totalStudyTime,
                completionRate: analysisData.completionRate,
                overtimeRate: analysisData.overtimeRate,
                averageTaskTime: analysisData.averageTaskTime,
                learningState: learningState.executionLevel,
                fatigueLevel: learningState.fatigueLevel,
                focusLevel: learningState.focusLevel,

                ...reply
            }
        })
    } catch (error) {
        console.log(error);
        res.json({ data: 'ai error' })
    }
})
//ai陪伴学习
PlanRouter.post('/help', async (req, res) => {
    try {
        const { task, goal, taskList } = req.body
        console.log(task);

        function analyzeProblem(task) {

            const estimated =
                task.estimatedMinutes * 60

            const focusRate =
                task.duringTime / estimated

            // 注意力问题
            if (
                task.pauseCount >= 3 &&
                focusRate < 0.5
            ) {
                return "attention"
            }

            // 理解困难
            if (
                focusRate > 1.5 &&
                task.pauseCount >= 2
            ) {
                return "difficulty"
            }

            // 疲劳
            if (
                focusRate > 2
            ) {
                return "fatigue"
            }

            return "normal"
        }
        const foucsTime = task.duringTime / 60
        const analyzeResult = analyzeProblem(task)
        if (analyzeResult === "normal") {

            return res.json({
                data: null
            });
        }
        const helpPrompt = `
你是一个学习行为分析AI。

你的职责不是安慰用户，
而是诊断学习问题。

你必须根据：

- 当前任务
- 实际学习时间
- 预计学习时间
- 暂停次数
- 已完成任务

分析用户为什么卡住。

---

用户状态类型：

- attention：
  用户频繁暂停，
  但实际学习时间较少，
  说明注意力分散。

- difficulty：
  用户学习时间远超预期，
  说明理解困难。

- fatigue：
  用户学习时间过长，
  说明学习疲劳。

---

message 输出格式必须严格如下：

【当前问题】
...

【判断依据】
...

【建议】
...

---

禁止：

- 空泛鼓励
- “继续加油”
- “你已经很棒了”
- 泛泛建议
- 废话

---

输出要求：

- 每次至少给用户提供不少于两个意见

actions 只能从以下列表中选择：

[
  {
    "type":"split_task",
    "label":"拆分任务"
  },

   {
    "type":"explain_concept",
    "label":"解释概念"
  },

  {
    "type":"easier_practice",
    "label":"简单练习"
  },

  {
    "type":"review_basic",
    "label":"回顾基础"
  },

  {
    "type":"take_break",
    "label":"休息一下"
  },

  {
    "type":"skip_task",
    "label":"跳过任务"
  }
]

---

只允许输出 JSON：

{
  "reason":"",
  "message":"",
  "actions":[]
}
`
        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: "system", content: helpPrompt },
                {
                    role: "user",
                    content: `
当前任务：
${task.content}

学习目标：
${goal}

用户状态分析：
${analyzeResult}

实际学习时长：
${foucsTime}

暂停次数：
${task.pauseCount}

预计完成任务时间：
${task.estimatedMinutes}

已经完成的任务：
${taskList
                            .filter(i => i.status === "done")
                            .map(i => i.content)}
`
                }
            ]
        })
        console.log(result.choices[0].message.content);
        const reply = parseIfJson(result.choices[0].message.content)
        res.json({
            data: {
                id: task.id,
                problemType: analyzeResult,
                ...reply
            }
        })
    } catch (error) {
        console.log(error);
        res.json({ data: 'ai error' })
    }

})

//生成简单练习
PlanRouter.post('/text', async (req, res) => {
    try {
        const { task } = req.body
        const textPropmt = `
    你是一个学习助手 AI。

你的任务是：
根据用户当前学习的知识点，
生成一些适合练习的题目。

要求：

1. 题目必须围绕当前学习内容
2. 难度适中，适合初学者
3. 题目数量控制在 3~5 个
4. 每道题要简洁明确
5. 不要生成答案
6. 不要输出 markdown
7. 只返回 JSON 数组
8. 生成选择题

返回格式：

[
  {
    "title": "题目标题",
    "description": "题目描述",
    "difficulty": 1,
    "type": "coding"
  }
]

difficulty:
1 = 简单
2 = 中等
3 = 偏难

type 可选：
- coding
- choice
- debug
- fill_blank

    `
        const result = await client.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: 'system', content: textPropmt },
                {
                    role: 'user',
                    content: `
                用户学习内容：
                ${task.content}
                `

                }
            ]
        })
        console.log(result.choices[0].message.content);
        const reply = parseIfJson(result.choices[0].message.content)
        res.json({ data: reply })
    } catch (error) {
        console.log(error);
        res.json({ data: 'ai error' })

    }
})
//概念解释
PlanRouter.post('/explain', async (req, res) => {
    try {

        const { task } = req.body

        const explainPrompt = `
你是一个学习助手 AI。

你的任务：
解释用户当前学习的技术概念。

要求：

1. 使用简单易懂的语言
2. 适合初学者
3. 内容简洁清晰
4. 必须包含：
   - 概念名称
   - 概念解释
   - 核心作用
   - 简单代码示例
5. 不要输出 markdown
6. 不要输出解释文字
7. 不要输出 \`\`\`
8. 只返回 JSON

返回格式：

{
  "title": "概念名称",
  "explain": "概念解释",
  "purpose": "核心作用",
  "example": "代码示例"
}

用户学习内容：
${task.content}
`

        const result =
            await client.chat.completions.create({
                model: "qwen-turbo",
                messages: [
                    {
                        role: "system",
                        content: explainPrompt
                    },
                    {
                        role: "user",
                        content: task.content
                    }
                ]
            })

        const reply = parseIfJson(
            result.choices[0].message.content
        )

        res.json({
            data: reply
        })

    } catch (error) {

        console.log(error)

        res.json({
            data: 'ai error'
        })
    }
})
//基础回顾
PlanRouter.post('/review', async (req, res) => {
    try {

        const { task } = req.body

        const reviewPrompt = `
你是一个编程学习助手 AI。

你的任务：
帮助用户回顾当前学习内容的基础知识。

要求：

1. 总结核心基础知识
2. 适合初学者复习
3. 使用简洁语言
4. 必须包含：
   - 知识点
   - 基础规则
   - 常见用法
   - 学习重点
5. 不要输出 markdown
6. 不要输出解释文字
7. 不要输出 \`\`\`
8. 只返回 JSON 数组

返回格式：

[
  {
    "title": "知识点",
    "content": "基础内容",
    "usage": "常见用法",
    "focus": "学习重点"
  }
]

用户学习内容：
${task.content}
`

        const result =
            await client.chat.completions.create({
                model: "qwen-turbo",
                messages: [
                    {
                        role: "system",
                        content: reviewPrompt
                    },
                    {
                        role: "user",
                        content: task.content
                    }
                ]
            })

        const reply = parseIfJson(
            result.choices[0].message.content
        )

        res.json({
            data: reply
        })

    } catch (error) {

        console.log(error)

        res.json({
            data: 'ai error'
        })
    }
})

//获得总任务列表

PlanRouter.get('/getList/:userId', async (req, res) => {
    try {
        console.log('diaoyong');
        const { userId } = req.params

        const result = await db.query(
            `
            SELECT
                p.id,
                p.goal,
                p.created_at,

                COUNT(t.id) AS total_tasks,

                COUNT(*) FILTER(
                    WHERE t.status='done'
                ) AS done_tasks

            FROM study_plans p

            LEFT JOIN study_tasks t
            ON p.id = t.plan_id

            WHERE p.user_id=$1

            GROUP BY p.id

            ORDER BY p.created_at DESC
            `,
            [userId]
        )
        console.log(result);

        const data = result.rows.map(item => ({
            ...item,
            progress:
                item.total_tasks == 0
                    ? 0
                    : Math.floor(
                        item.done_tasks /
                        item.total_tasks *
                        100
                    )
        }))

        res.json({
            data
        })

    } catch (error) {
        console.log(error)
    }
})
//今日是否已生成学习计划
PlanRouter.get('/continue/:planId', async (req, res) => {
    try {
        const { planId } = req.params

        const today =
            new Date()
                .toISOString()
                .split('T')[0]

        const planResult =
            await db.query(
                `
                    SELECT *
                    FROM daily_plans
                    WHERE plan_id=$1
                    AND plan_date=$2
                    `,
                [planId, today]
            )

        if (
            planResult.rows.length === 0
        ) {

            return res.json({
                hasPlan: false
            })
        }

        const dailyPlan =
            planResult.rows[0]

        const taskResult =
            await db.query(
                `
                    SELECT *
                    FROM daily_tasks
                    WHERE daily_plan_id=$1
                    ORDER BY created_at
                    `,
                [dailyPlan.id]
            )

        return res.json({
            hasPlan: true,
            dailyPlan,
            tasks: taskResult.rows
        })

    } catch (error) {

        console.log(error)

    }
}
)
export default PlanRouter