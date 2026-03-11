const { sequelize } = require('../models');
(async () => {
    try {
        await sequelize.authenticate();
        const [[r]] = await sequelize.query('SELECT MAX(id) as maxid FROM "Invoices"');
        const m = r.maxid || 0;
        await sequelize.query(`SELECT setval('"Invoices_id_seq"', ${m}, true)`);
        console.log('Invoices sequence reset to', m);
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
})();
