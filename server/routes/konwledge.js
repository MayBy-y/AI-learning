import express from 'express'
import db from '../db/index.js'
import multer from 'multer'
const konwRouter = express.Router()


// 添加知识
konwRouter.post('/add', async (req, res) => {

    try {

        const { userId, title, content, tags, resource_url, resource_name } = req.body

        const sql = `
    
           INSERT INTO knowledge
(
 title,
 content,
 tags,
 resource_url,
 resource_name,
 user_id,
created_at
)

VALUES
(
 $1,
 $2,
 $3,
 $4,
 $5,
 $6,
 CURRENT_DATE
)
 RETURNING id
        `

        const result = await db.query(sql, [
            title,
            content,
            tags,
            resource_url || null,
            resource_name || null,
            userId
        ])
        const id = result.rows[0].id

        await db.query(
            `
            INSERT INTO knowledge_mastery
            (
                id,
                user_id,
                knowledge_id,
                knowledge_name,
                mastery,
                review_count,
                last_review_time,
                next_review_time
            )
            VALUES
            (
                gen_random_uuid(),
                $1,
                $2,
                $3,
                10,
                0,
                NULL,
                CURRENT_DATE
            )
            `,
            [
                userId,
                id,
                title
            ]
        )

        await db.query('COMMIT')

        res.send({
            message: '添加成功',
            id
        })

    } catch (error) {

        console.log(error)

        res.status(500).send({
            message: '服务器错误'
        })
    }

})
//获取知识库列表
konwRouter.get('/list/:id', async (req, res) => {
    const { id } = req.params
    const sql = `
  SELECT *
  FROM knowledge
  WHERE user_id = $1
  ORDER BY created_at DESC
`;

    const result = await db.query(sql, [id]);

    res.send(result.rows)

})
konwRouter.get('/reviewList/:id', async (req, res) => {
    const { id } = req.params
    const sql = `
 SELECT *
FROM knowledge_mastery
WHERE
    user_id = $1
    AND next_review_time <= NOW()
`;

    const result = await db.query(sql, [id]);

    res.send(result.rows)

})
konwRouter.delete("/delete/:id", async (req, res) => {

    try {

        const { id } = req.params;
        await db.query(
            `DELETE FROM knowledge_mastery
     WHERE knowledge_id=$1`,
            [id]
        )

        const sql = `
            DELETE FROM knowledge
            WHERE id = $1
        `;

        const result = await db.query(sql, [id]);

        // rowCount 表示影响了几行
        if (result.rowCount === 0) {

            return res.status(404).send({
                message: "未找到该知识"
            });

        }

        res.send({
            message: "删除成功"
        });

    } catch (error) {

        console.log(error);

        res.status(500).send({
            message: "服务器错误"
        });

    }

});
//修改
konwRouter.put("/update/:id", async (req, res) => {

    try {

        const { id } = req.params

        const {

            title,

            content,

            tags,
            resource_url,
            resource_name

        } = req.body

        await db.query(

            `
        UPDATE knowledge

        SET

        title=$1,

        content=$2,

        tags=$3,
        resource_url=$4,
        resource_name=$5

        WHERE id=$6
        `,

            [

                title,

                content,

                tags,

                resource_url,
                resource_name,
                id

            ]

        )

        res.send({
            success: true
        })

    }
    catch (err) {
        console.log(err);

        res.status(500)
            .send(err)

    }

})

//文件上传，这个是自定义文件名
const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(
            null,
            "uploads/"
        )

    },

    filename(req, file, cb) {

        const originalName =

            Buffer.from(

                file.originalname,

                "latin1"

            ).toString("utf8")

        const uniqueName =

            Date.now()

            +

            "-"

            +

            originalName

        cb(

            null,

            uniqueName

        )

    }

})
const upload = multer({

    storage

})
//新增上传接口
konwRouter.post(

    "/upload",

    upload.single("file"),

    (req, res) => {

        try {

            if (!req.file) {

                return res
                    .status(400)
                    .send("没有文件")

            }

            const originalName =

                Buffer.from(

                    req.file.originalname,

                    "latin1"

                ).toString("utf8")

            res.send({

                fileName:

                    originalName,

                fileUrl:

                    `/uploads/${req.file.filename}`

            })

        }
        catch (err) {

            console.log(err)

            res
                .status(500)
                .send("上传失败")

        }

    })
konwRouter.get("/:id", async (req, res) => {

    const { id } =

        req.params

    const result =

        await db.query(

            `

SELECT *

FROM knowledge

WHERE id=$1

`,

            [id]

        )

    res.send(

        result.rows[0]

    )

}
)
export default konwRouter