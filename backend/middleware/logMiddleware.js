const helper = require('../utils/logger');

const actionMap = {
    // Auth
    'POST /api/users/login': 'LOGIN', 
    
    // Admin Routes (using the full path including /api/admin)
    'POST /api/admin/create': 'CREATE_USER',
    'PATCH /api/admin/update': 'UPDATE_USER',
    'DELETE /api/admin/delete': 'DELETE_USER',
    
    // Order Routes
    'POST /api/orders': 'CREATE_ORDER',
    'PUT /api/orders/confirm': 'CONFIRM_PAYMENT',
    'PUT /api/orders/status': 'UPDATE_ORDER_STATUS',
    'DELETE /api/orders': 'DELETE_ORDER'
};



exports.activityLogger = (req, res, next) => {
    const monitoredMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if(!monitoredMethods.includes(req.method)){
        return next();
    }
    res.on('finish', () => {
        if(res.statusCode >= 200 && res.statusCode < 300){
            const urlPath  = req.originalUrl.split('?')[0];
            const cleanUrl = '/' + urlPath.split('/').filter(part => part && isNaN(part)).join('/');

            const actionKey = `${req.method} ${cleanUrl}`;
            const actionName = actionMap[actionKey] || `UNKNOWN_ACTION (${req.method})`;
            const userId = req.user ? req.user.id : null;
            const targetId = req.params.id || req.body.id || null;

            const performer = req.user?.username || req.body.username || 'System/Guest';
            const details = `User ${performer} performed ${actionName} on ${req.originalUrl}`;
            const io = req.io;
            const role = req.user ? req.user.role : 'Guest';
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            helper.createLog(userId, actionName, targetId, details, io, role, ip);
        }
    });

    next();
}
