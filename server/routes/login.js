// routes/user.ts
import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import db from "../db/index.js"
import auth from "../middleware/auth.js"
const router = express.Router()

router.post("/register", async (req, res) => {

    try {

        const { username, password } = req.body

        if (!username || !password) {

            return res.status(400).json({
                message: "用户名或密码不能为空"
            })

        }

        const result = await db.query(
            `
            SELECT *
            FROM users
            WHERE username = $1
            `,
            [username]
        )

        if (result.rows.length > 0) {

            return res.status(400).json({
                message: "用户名已存在"
            })

        }

        const hashPassword =
            await bcrypt.hash(password, 10)

        await db.query(
            `
            INSERT INTO users
            (
                username,
                password
            )

            VALUES
            (
                $1,
                $2
            )
            `,
            [username, hashPassword]
        )

        res.json({
            message: "注册成功"
        })

    } catch (err) {

        console.log(err)

        res.status(500).json({
            message: "服务器错误"
        })

    }

})
//登录
router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body

        const result = await db.query(
            `
            SELECT *
            FROM users
            WHERE username = $1
            `,
            [username]
        )

        if (result.rows.length === 0) {

            return res.status(400).json({
                message: "用户不存在"
            })

        }

        const user = result.rows[0]

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            )

        if (!isMatch) {

            return res.status(400).json({
                message: "密码错误"
            })

        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        )

        res.json({
            message: "登录成功",
            token
        })

    } catch (err) {

        console.log(err)

        res.status(500).json({
            message: "服务器错误"
        })

    }

})
//测试
router.get("/me", auth, (req, res) => {

    res.json({
        user: req.user
    })

})
export default router;