const { Order, Retailer, User } = require('./models');
const { Op } = require('sequelize');

async function testSearch() {
    console.log('--- Starting Search Verification ---');

    // 1. Find an order with NULL salesRepId
    const orderWithNoRep = await Order.findOne({
        where: { salesRepId: null },
        include: [{ model: Retailer, as: 'retailer' }]
    });

    if (!orderWithNoRep) {
        console.log('No orders with NULL salesRepId found. Cannot fully verify fix.');
    } else {
        console.log(`Found order ID ${orderWithNoRep.id} with no sales rep. Bill: ${orderWithNoRep.billNumber || 'N/A'}`);
        
        const searchTerm = orderWithNoRep.billNumber || orderWithNoRep.id.toString();
        console.log(`Searching for "${searchTerm}"...`);

        const searchConditions = [
            { billNumber: { [Op.iLike]: `%${searchTerm}%` } },
            { '$retailer.shopName$': { [Op.iLike]: `%${searchTerm}%` } },
            { '$salesRep.name$': { [Op.iLike]: `%${searchTerm}%` } }
        ];

        if (!isNaN(searchTerm)) {
            searchConditions.push({ id: parseInt(searchTerm) });
        }

        const whereClause = { [Op.and]: [{ [Op.or]: searchConditions }] };

        const results = await Order.findAll({
            where: whereClause,
            include: [
                { model: Retailer, as: 'retailer', attributes: [], required: false },
                { model: User, as: 'salesRep', attributes: [], required: false }
            ],
            attributes: ['id', 'billNumber']
        });

        console.log(`Results found: ${results.length}`);
        const found = results.some(r => r.id === orderWithNoRep.id);
        console.log(`Fix verified: ${found ? 'PASSED ✅' : 'FAILED ❌'}`);
    }

    // 2. Test ID search specifically
    const someOrder = await Order.findOne();
    if (someOrder) {
        console.log(`Testing ID search for ${someOrder.id}...`);
        const results = await Order.findAll({
            where: {
                [Op.or]: [
                    { id: someOrder.id },
                    { billNumber: { [Op.iLike]: `%${someOrder.id}%` } }
                ]
            },
            include: [
                { model: Retailer, as: 'retailer', attributes: [], required: false },
                { model: User, as: 'salesRep', attributes: [], required: false }
            ]
        });
        console.log(`ID Search verified: ${results.length > 0 ? 'PASSED ✅' : 'FAILED ❌'}`);
    }

    console.log('--- Verification Complete ---');
    process.exit(0);
}

testSearch().catch(e => {
    console.error(e);
    process.exit(1);
});
