//执行层
import db from "../db/index.js"
export const toolMap = {
    getReviewWords: async () => {
        return {
            type: "review_words",
            data: ["apple", "banana"]
        };
    },

    getTodayPlan: async (userId) => {

        const result = await db.query(
            `
        SELECT
            dt.id,
            dt.content,
            dt.status,
            dt.estimated_minutes,
            dt.difficulty
        FROM daily_plans dp
        JOIN daily_tasks dt
            ON dt.daily_plan_id = dp.id
        WHERE dp.user_id = $1
        AND dp.plan_date = CURRENT_DATE
        ORDER BY dt.created_at ASC
        `,
            [userId]
        )
        return {
            type: "today_plan",
            data: result.rows
        }
    },

    searchKnowledge: async (query) => {
        return {
            type: "knowledge",
            data: [`关于 ${query} 的知识...`]
        };
    },


    getReviewPlan: async (userId) => {

        const result = await db.query(
            `
       SELECT *
FROM knowledge_mastery
WHERE
    user_id = $1
    AND next_review_time <= NOW()
        `,
            [userId]
        )
        return {
            type: "review",
            data: result.rows
        }
    },

    getUserStatus: async (userId) => {
        const result = await db.query(
            `
        SELECT *
        FROM study_reports
        WHERE user_id = $1
        ORDER BY report_date DESC
        LIMIT 1
        `,
            [userId]
        )

        if (result.rows.length === 0) {
            return {
                type: "user_status",
                data: null
            }
        }

        return {
            type: "user_status",
            data: result.rows[0]
        }
    }
};
//tool说明书
export const tools = {
    getReviewWords: {
        name: "getReviewWords",
        description: "用户需要复习单词/背单词时使用",
        parameters: {}
    },

    getTodayPlan: {
        name: "getTodayPlan",
        description: `
用户询问“今天学什么 / 学习计划 / 今日任务安排”时使用。

典型触发关键词：
- 今天学什么
- 今日计划
- 学习安排
- 今天任务
- 今天要做什么
- 学习任务列表

适用场景：
- 获取当天学习任务
- 获取学习路径规划
- 获取当前阶段应该学习的内容

返回内容通常包括：
- 技术学习任务（如 React / TS / Node）
- 练习任务
- 复习任务

禁止用于：
- 知识解释（useEffect 是什么）
- 单词复习
- 学习状态统计
`,
        parameters: {}
    },
    searchKnowledge: {
        name: "searchKnowledge",
        description: `
用户在询问“概念解释 / 技术原理 / 编程知识”时使用。

典型触发关键词：
- 什么是 useEffect
- 什么是闭包
- 什么是 Promise
- JS 原理
- React 原理
- 概念解释
- 机制 / 原理 / 作用

适用场景：
- 解释技术概念
- 解释原理
- 提供知识点说明
- 提供简单示例代码

输入参数：
- query：用户具体问题关键词

禁止用于：
- 学习计划
- 学习状态
- 单词复习
`,
        parameters: {
            query: "string"
        }
    },

    // 📘 新增：复习计划
    getReviewPlan: {
        name: "getReviewPlan",
        description: `
用户需要查看复习计划 / 今日复习内容 / 下一步复习安排时使用。

典型触发关键词：
- 复习计划
- 今天复习什么
- 我要复习什么
- 下一步学什么
- 复习安排
- 学习回顾计划

适用场景：
- 根据艾宾浩斯复习安排
- 查看今日需要复习的知识点
- 查看未来待复习内容

不要用于：
- 单纯知识解释
- 单词查询
- 学习状态分析
`,
        parameters: {
            userId: "string (optional，用于获取用户个性化计划)"
        }
    },

    // 📊 新增：学习状态
    getUserStatus: {
        name: "getUserStatus",
        description: `
用户询问自己的学习情况、进度、数据统计时使用。

典型触发关键词：
- 我的学习情况
- 学习进度
- 学习状态
- 我学了多久
- 完成了多少任务
- 掌握情况
- 学习数据
- 最近表现

适用场景：
- 查看学习统计数据
- 查看完成任务数量
- 查看掌握程度（mastery）
- 查看学习天数 / streak

不要用于：
- 复习计划
- 知识讲解
- 单词复习
`,
        parameters: {
            userId: "string (optional，用于获取用户学习数据)"
        }
    }
};