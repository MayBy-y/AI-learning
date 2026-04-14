import { Pool } from 'pg'
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "AI learning",
    password: "liuyuhan",
    port: 5432
})
async function testConnection() {
    try {
        const res = await pool.query("SELECT NOW()")
        console.log("数据库连接成功:", res.rows[0])
    } catch (err) {
        console.error("数据库连接失败:", err)
    }
}

testConnection()

export default pool