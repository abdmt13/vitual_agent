import mysql from "mysql2/promise";

export async function connectDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.2",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "agentevirtualmvp",
    charset: "utf8mb4",
    connectionLimit: 5,
    connectTimeout: 5000
  });
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS chatbot_conversations (
      session_id VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
      previous_response_id VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    await pool.query(`CREATE TABLE IF NOT EXISTS chatbot_messages (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
      role ENUM('user', 'assistant') NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chatbot_conversations(session_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  } catch (error) {
    await pool.end();
    throw error;
  }
  return {
    async getPreviousResponseId(sessionId) {
      const [rows] = await pool.execute(
        "SELECT previous_response_id FROM chatbot_conversations WHERE session_id = ?", [sessionId]);
      return rows[0]?.previous_response_id;
    },
    async saveTurn(sessionId, message, reply, responseId = null) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute(`INSERT INTO chatbot_conversations (session_id, previous_response_id)
          VALUES (?, ?) ON DUPLICATE KEY UPDATE previous_response_id = ?`, [sessionId, responseId, responseId]);
        await connection.execute(`INSERT INTO chatbot_messages (session_id, role, content)
          VALUES (?, 'user', ?), (?, 'assistant', ?)`, [sessionId, message, sessionId, reply]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async getMessages(sessionId) {
      const [rows] = await pool.execute(
        "SELECT role, content FROM chatbot_messages WHERE session_id = ? ORDER BY id", [sessionId]);
      return rows;
    },
    async deleteConversation(sessionId) {
      await pool.execute("DELETE FROM chatbot_conversations WHERE session_id = ?", [sessionId]);
    },
    close: () => pool.end()
  };
}
