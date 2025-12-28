const db = require('./config/db');

exports.createLog = async (userId, action, targetId, detail) => {
    try{
        await db.execute(
            "INSERT INTO activity_logs (user_id, action, target_id, details) VALUES (?, ?, ?, ?)",
            [userId, action, targetId, detail]
        );
        console.log(`[LOG]: ${action} by user ${userId}`);
    }catch (error){
        console.error("Gagal membuat Log: ", error.message);
    }
}