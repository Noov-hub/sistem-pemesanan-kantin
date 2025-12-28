const db = require('../config/db');

exports.createLog = async (userId, action, targetId, details, io, role, ip) => {
    try{
        const [result] = await db.execute(
            "INSERT INTO activity_logs (user_id, action, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?)",
            [userId, action, targetId, details, ip]
        );

        const extractedUsername = details.split(' ')[1] || 'Guest';

        if(io){
            io.emit('new_log', {
                id: result.insertId,
                username: extractedUsername,
                user_id: userId,
                role: role || "staff",
                ip: ip,
                action,
                target_id: targetId,
                details,
                created_at: new Date()
            });
        }
        console.log(`[LOG]: ${action} by user ${extractedUsername}`);
    }catch (error){
        console.error("Gagal membuat Log: ", error.message);
    }
}