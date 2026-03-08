require('dotenv').config();
const { getLedgerReportData } = require('./controllers/reportController.js');

async function run() {
    const req = {
        body: {
            retailerIds: [1, 2, 3],
            startDate: '2025-01-01',
            endDate: '2026-12-31'
        }
    };

    const res = {
        status: (code) => {
            console.log('Status:', code);
            return res;
        },
        json: (data) => {
            console.log('JSON Output:', JSON.stringify(data, null, 2));
        }
    };

    await getLedgerReportData(req, res);
}

run().catch(console.error);
