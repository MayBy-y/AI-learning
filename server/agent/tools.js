//执行层
export const toolMap = {
    getReviewWords: async () => {
        const words = ["apple", "banana"];
        return { words, finalAnswer: null }; // finalAnswer null 表示还没结束
    },
};
//tool说明书
export const tools = {
    getReviewWords: {
        name: 'getReviewWords',
        description: "仅当用户明确表示“复习单词”或“记单词”时使用不适用于泛化学习需求（如“学习六级”、“学习英语”）",
        parameters: {}
    }
}