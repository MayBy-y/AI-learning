import express from "express"

const ChatRouter = express.Router()

ChatRouter.post('/aiChat', async (req, res) => {
    const reply = '嘘嘘嘘'
    res.json({ reply })
})
export default ChatRouter