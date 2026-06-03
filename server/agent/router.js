import { callLLM } from "../services/llm.js"
import { tools } from "./tools.js"
function buildToolPropmt() {
    return Object.entries(tools)
        .map(([name, info]) => {
            return `- ${name}: ${info.description}`
        })
        .join("\n")
}
function buildContext(message) {
    return message
        .slice(-3)
        .map(m => `${m.role}: ${m.content}`)
        .join("\n")
}
async function delectIntentLmm(input, messages) {
    const routerPromt = `
你是意图分类器，只返回JSON：

可选：
- review_word
- chat

规则：
- “复习单词 / 背单词” → review_word
- 其他 → chat

输入：
"${input}"

输出：
{"intent": ""}`
    try {
        const res = await callLLM({
            system: routerPromt,
            user: input,
            stream: false,
        })
        console.log(JSON.parse(res).intent);

        return JSON.parse(res).intent
    } catch (error) {
        return "chat"
    }

}
export default delectIntentLmm