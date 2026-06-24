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
function safeParseJSON(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        // 尝试提取 JSON
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (err) {
                return null;
            }
        }
        return null;
    }
}
async function delectIntentLmm(input, messages) {
    const routerPrompt = `
你是“用户意图分类器”。

你必须严格返回 JSON（禁止任何多余内容）：

{
  "intent": "chat | review_word | today_plan | knowledge | review | user"
}

规则：

1. 复习单词 / 背单词 → review_word
2. 今日学习计划 / 今天任务 → today_plan
3. 知识查询 / 学习内容 → knowledge
4. 复习计划 / 复习 → review
5. 我的状态 / 学习情况 → user
6. 其他所有情况 → chat

严格要求：
- 只能输出 JSON
- 不能有 markdown
- 不能有解释
- 不能有多余字段

用户输入：
${input}
`;
    try {
        const res = await callLLM({
            system: routerPrompt,
            user: input,
            stream: false,
        })
        const parsed = safeParseJSON(res);

        const intent = parsed?.intent;

        const validIntents = [
            "chat",
            "review_word",
            "today_plan",
            "knowledge",
            "review",
            "user"
        ];

        if (validIntents.includes(intent)) {
            // console.log(intent);
            return intent;


        }

        return "chat"; // fallback
    } catch (error) {
        return "chat"
    }

}
export default delectIntentLmm