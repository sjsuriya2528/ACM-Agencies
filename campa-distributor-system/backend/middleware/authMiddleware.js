const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded Token ID:', decoded.id);

            req.user = await User.findByPk(decoded.id);

            if (!req.user) {
                console.warn(`User with ID ${decoded.id} not found in database.`);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed: ' + error.message });
        }
    }

    if (!token) {
        console.warn('Authorization attempt without token.');
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        console.log(`[AuthDebug] User Role: ${req.user.role}, Allowed Roles: ${roles}`);

        // Explicitly allow admin to bypass role checks for debugging/fix
        if (req.user.role === 'admin') {
            console.log('[AuthDebug] Admin access granted via bypass.');
            return next();
        }

        if (!roles.includes(req.user.role)) {
            console.error(`[AuthDebug] Access Denied. Role '${req.user.role}' not in [${roles}]`);
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
