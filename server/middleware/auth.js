import jwt from "jsonwebtoken"

export default function auth(
    req,
    res,
    next
) {

    const authHeader =
        req.headers.authorization

    if (!authHeader) {

        return res.status(401).json({
            message: "请先登录"
        })

    }

    const token =
        authHeader.split(" ")[1]

    try {

        const user =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            )

        req.user = user

        next()

    } catch {

        return res.status(401).json({
            message: "Token失效"
        })

    }

}