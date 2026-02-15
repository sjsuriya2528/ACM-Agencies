
const { Invoice, sequelize } = require('../models');

async function resetSequences() {
    const transaction = await sequelize.transaction();
    try {
        console.log("Deleting Invoice #1022...");
        await Invoice.destroy({ where: { id: 1022 }, transaction });
        console.log("Invoice #1022 deleted.");

        console.log("Resetting sequences to 1020...");

        // Reset Orders sequence
        await sequelize.query(`ALTER SEQUENCE "Orders_id_seq" RESTART WITH 1020;`, { transaction });
        console.log("Orders sequence reset to 1020.");

        // Reset Invoices sequence
        await sequelize.query(`ALTER SEQUENCE "Invoices_id_seq" RESTART WITH 1020;`, { transaction });
        console.log("Invoices sequence reset to 1020.");

        await transaction.commit();
        console.log("All operations completed successfully.");

    } catch (e) {
        console.error("Error resetting sequences:", e);
        await transaction.rollback();
    } finally {
        await sequelize.close();
    }
}

resetSequences();
