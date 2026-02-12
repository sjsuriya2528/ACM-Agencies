const { Delivery, Invoice, Order, User, Retailer } = require('../models');

// @desc    Assign delivery to driver
// @route   POST /api/deliveries
// @access  Private (Admin)
const assignDelivery = async (req, res) => {
    const { invoiceId, driverId } = req.body;

    try {
        const invoice = await Invoice.findByPk(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const startLocation = { lat: 0, lng: 0 }; // Placeholder or Warehouse/Office location

        const delivery = await Delivery.create({
            invoiceId,
            driverId,
            status: 'Pending',
            gpsLatitude: startLocation.lat,
            gpsLongitude: startLocation.lng,
        });

        res.status(201).json(delivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get deliveries
// @route   GET /api/deliveries
// @access  Private (Admin/Driver)
const getDeliveries = async (req, res) => {
    try {
        let whereClause = {};
        if (req.user.role === 'driver') {
            whereClause = { driverId: req.user.id };
        }

        const deliveries = await Delivery.findAll({
            where: whereClause,
            include: [
                {
                    model: Invoice,
                    include: [{
                        model: Order,
                        include: [{ model: Retailer, as: 'retailer' }]
                    }]
                },
                { model: User, as: 'driver', attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(deliveries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update delivery status
// @route   PUT /api/deliveries/:id/status
// @access  Private (Driver/Admin)
const updateDeliveryStatus = async (req, res) => {
    const { status, gpsLatitude, gpsLongitude } = req.body; // 'In Transit', 'Delivered'

    try {
        const delivery = await Delivery.findByPk(req.params.id);

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // specific check for driver?
        if (req.user.role === 'driver' && delivery.driverId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this delivery' });
        }

        delivery.status = status;
        if (status === 'Delivered') {
            delivery.deliveryTime = new Date();
            if (gpsLatitude) delivery.gpsLatitude = gpsLatitude;
            if (gpsLongitude) delivery.gpsLongitude = gpsLongitude;
        } else if (status === 'In Transit') {
            // capture start time?
        }

        await delivery.save();
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    assignDelivery,
    getDeliveries,
    updateDeliveryStatus,
};
