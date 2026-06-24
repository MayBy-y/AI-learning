import delectIntentLmm from "./router.js";
import { chatPrompt, wordReviewPrompt, planPrompt, userStatusPrompt, knowledgePrompt, reviewPrompt } from "./prompts.js";
import { toolMap } from "./tools.js";
import { callLLM } from "../services/llm.js";
// export async function runAgent(input, messages) {
//     const MAX_STEPS = 5;
//     let steps = 0;
//     const executedTools = new Set();
//     while (steps++ < MAX_STEPS) {
//         const action = await delectIntentLmm(input);
//         if (action.type === 'tool' && executedTools.has(action.name)) {
//             action.type = 'chat';
//             action.content = "工具已经执行过，输出总结回答";
//         }

//         if (action.type === 'tool') {
//             const result = await toolMap[action.name](action.params);
//             executedTools.add(action.name);
//             messages.push({
//                 role: "tool",
//                 name: action.name,
//                 content: '用户需要复习的单词列表' + JSON.stringify(result.words)
//             });
//             console.log(messages);

//             if (result.finalAnswer) {
//                 // 工具返回最终结果
//                 return result.finalAnswer;
//             }

//             continue; // 继续下一轮
//         }

//         if (action.type === 'chat') {
//             return await callLLM({
//                 system: chatPrompt,
//                 message: messages,
//                 user: action.content
//             });
//         }
//     }

//     return "任务过长，无法完成"; // 超出步数上限
// }
export async function runAgent(input, messages, userId) {
    const intent = await delectIntentLmm(input, messages)
    console.log({
        '用户id：':
            userId,
        '测试日志':
            input,
        intent,
        time: Date.now()
    })
    test()

    switch (intent) {
        case "review_word":
            return await handleReviewWord(messages);
        case "chat":
            return await callLLM({
                system: chatPrompt,
                message: messages,
                user: input,
                stream: true
            })
        case "today_plan":
            return await handlePlan(messages, userId);
        case "knowledge":
            return await handleKnowledge(messages, userId);
        case "review":
            return await handleReview(messages, userId);
        case "user":
            return await handleUser(messages, userId);

    }
}

async function handlePlan(messages, userId) {
    const result = await toolMap["getTodayPlan"](userId);
    console.log('plan:', result.data);

    messages.push({
        role: "tool",
        name: " getTodayPlan",
        content: JSON.stringify(result.data)
    });

    return await callLLM({
        system: planPrompt,
        message: messages,
        user: "这是我今天的学习计划",
        stream: true
    });
}
async function handleKnowledge(messages, userId) {
    const result = await toolMap["searchKnowledge"]();

    messages.push({
        role: "tool",
        name: "searchKnowledge",
        content: JSON.stringify(result.data)
    });

    return await callLLM({
        system: knowledgePrompt,
        message: messages,
        user: "这是我知识库里面的知识",
        stream: true
    });
}
async function handleUser(messages, userId) {
    const result = await toolMap["getUserStatus"](userId);

    messages.push({
        role: "tool",
        name: "getUserStatus",
        content: JSON.stringify(result.data)
    });

    return await callLLM({
        system: userStatusPrompt,
        message: messages,
        user: "这是我近期的学习情况",
        stream: true
    });
}
async function handleReview(messages, userId) {
    const result = await toolMap["getReviewPlan"](userId);
    console.log(result.data);

    messages.push({
        role: "tool",
        name: "getReviewPlan",
        content: JSON.stringify(result.data)
    });

    return await callLLM({
        system: reviewPrompt,
        message: messages,
        user: "这是我今天要复习的知识点",
        stream: true
    });
}
async function handleReviewWord(messages) {
    const result = await toolMap["getReviewWords"]();

    messages.push({
        role: "tool",
        name: "getReviewWords",
        content: JSON.stringify(result.data)
    });

    return await callLLM({
        system: wordReviewPrompt,
        message: messages,
        user: "请根据这些单词带我复习",
        stream: true
    });
}
//测试用例
async function test() {
    const testCases = [
        { input: "我要复习单词", expect: "review_word" },
        { input: "今日计划", expect: "review_word" },
        { input: "我最近学习状态怎么样", expect: "learn_english" },
        { input: "我今天要复习什么", expect: "translate" },
        { input: "你好", expect: "chat" }
    ]
    for (const t of testCases) {
        const intent = await delectIntentLmm(t.input)
        console.log(t.input, intent, intent === t.expect ? "✅" : "❌")
    }
}