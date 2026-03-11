const { sequelize } = require('../models');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, '../../csv');

(async () => {
    try {
        await sequelize.authenticate();
        const [dbRows] = await sequelize.query('SELECT id, "invoiceNumber" FROM "Invoices"');
        const dbMap = {};
        dbRows.forEach(r => { dbMap[r.invoiceNumber] = r.id; });

        const csvRows = [];
        fs.createReadStream(path.join(CSV_DIR, 'Updated_Invoices.csv'))
            .pipe(csv())
            .on('data', r => csvRows.push({ id: parseInt(r.id), invoiceNumber: r.invoiceNumber }))
            .on('end', () => {
                const conflicts = csvRows.filter(r => {
                    const dbId = dbMap[r.invoiceNumber];
                    return dbId !== undefined && dbId !== r.id;
                });
                console.log('invoiceNumber conflicts (same num, different id):', conflicts.length);
                if (conflicts.length > 0) {
                    console.log('First 10:', JSON.stringify(conflicts.slice(0, 10), null, 2));
                }

                // Also check: CSV rows with IDs already in DB but trying to get inserted (not updated)
                const dbIdSet = new Set(dbRows.map(r => r.id));
                const csvNew = csvRows.filter(r => !dbIdSet.has(r.id));
                console.log('\nNew CSV invoice IDs (not yet in DB):', csvNew.length);
                console.log('Sample:', csvNew.slice(0, 10).map(r => r.id));

                process.exit(0);
            });
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
})();
