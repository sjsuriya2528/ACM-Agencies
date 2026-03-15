require('dotenv').config();
const { Invoice, Order, Retailer, User } = require('./models');
const { Op } = require('sequelize');

async function testApi() {
  try {
    const status = 'Pending';
    let whereClause = {};
    if (status === 'Pending') {
        whereClause.paymentStatus = { [Op.in]: ['Pending', 'Partially Paid'] };
    }

    const invoices = await Invoice.findAll({
        where: whereClause,
        include: [
            {
                model: Order,
                as: 'order',
                where: status === 'Pending' ? { status: 'Delivered' } : {},
                include: [
                    { model: Retailer, as: 'retailer', attributes: ['id', 'shopName', 'address'] },
                    { model: User, as: 'salesRep', attributes: ['name'] }
                ]
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: 2
    });

    console.log(JSON.stringify(invoices, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testApi();
