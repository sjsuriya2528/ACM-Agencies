const app = require('../server');
const db = require('../models');

module.exports = async (req, res) => {
    try {
        // Sync database before handling request.
        // In strict production environments, migrations should be done separately,
        // but for this setup we maintain the existing behavior.
        await db.sequelize.sync({ force: false });
    } catch (error) {
        console.error('Database sync error:', error);
    }

    return app(req, res);
};
