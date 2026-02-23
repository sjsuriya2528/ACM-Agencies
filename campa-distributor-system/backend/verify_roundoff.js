const { Order, OrderItem, Product, Retailer, Invoice, sequelize } = require('./models');
const { generateInvoiceData } = require('./controllers/orderController');

async function verifyRoundOff() {
    try {
        console.log('Testing Round Off Logic...');

        // Mock Order
        const mockOrder = {
            id: 9999,
            totalAmount: 100.00,
            roundOff: -0.01,
            retailer: {
                shopName: 'Test Shop',
                gstin: '33AAAAA0000A1Z5',
                address: 'Test Address',
                phone: '1234567890'
            },
            items: [
                {
                    productId: 1,
                    quantity: 1,
                    totalPrice: 84.75,
                    taxAmount: 15.26, // Total = 100.01
                    netAmount: 100.01,
                    Product: { name: 'Test Product', gstPercentage: 18 }
                }
            ]
        };

        const invoiceData = generateInvoiceData(mockOrder);

        console.log('Generated Invoice Data:');
        console.log('Subtotal:', invoiceData.subTotal);
        console.log('GST Total:', invoiceData.gstTotal);
        console.log('Round Off:', invoiceData.roundOff);
        console.log('Net Total:', invoiceData.netTotal);

        if (invoiceData.netTotal === '100' && invoiceData.roundOff === '-0.01') {
            console.log('✅ Round Off Logic Verified Successfully!');
        } else {
            console.error('❌ Round Off Logic Verification Failed!');
            console.error('Expected Net Total: 100, Got:', invoiceData.netTotal);
            console.error('Expected Round Off: -0.01, Got:', invoiceData.roundOff);
        }

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        // process.exit();
    }
}

verifyRoundOff();
