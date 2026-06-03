import delectIntentLmm from "./router.js";
import { chatPrompt, translatePrompt, wordReviewPrompt } from "./prompts.js";
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
export async function runAgent(input, messages) {
    const intent = await delectIntentLmm(input, messages)
    console.log({
        '测试日志':
            input,
        intent,
        time: Date.now()
    })
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
    }
}
async function handleReviewWord(messages) {
    const result = await toolMap["getReviewWords"]();

    messages.push({
        role: "tool",
        name: "getReviewWords",
        content: JSON.stringify(result.words)
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
        { input: "背单词", expect: "review_word" },
        { input: "我要学六级", expect: "learn_english" },
        { input: "hello怎么翻译", expect: "translate" },
        { input: "你好", expect: "chat" }
    ]
    for (const t of testCases) {
        const intent = await delectIntentLmm(t.input)
        console.log(t.input, intent, intent === t.expect ? "✅" : "❌")
    }
}