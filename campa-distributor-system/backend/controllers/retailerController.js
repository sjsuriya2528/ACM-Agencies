const { Retailer, Order, OrderItem, Invoice, Payment, User, Product } = require('../models');

// @desc    Get all retailers
// @route   GET /api/retailers
// @access  Private
const getRetailers = async (req, res) => {
    try {
        const retailers = await Retailer.findAll({
            order: [['shopName', 'ASC']]
        });
        res.json(retailers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get retailer by ID
// @route   GET /api/retailers/:id
// @access  Private
const getRetailerById = async (req, res) => {
    try {
        const retailer = await Retailer.findByPk(req.params.id, {
            include: [
                {
                    model: Order,
                    as: 'orders',
                    include: [
                        {
                            model: OrderItem,
                            as: 'items',
                            include: [{ model: Product, attributes: ['id', 'name', 'price'] }]
                        },
                        {
                            model: Invoice,
                            include: [
                                {
                                    model: Payment,
                                    include: [{ model: User, as: 'collectedBy', attributes: ['id', 'name'] }]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [[{ model: Order, as: 'orders' }, 'createdAt', 'DESC']]
        });

        if (retailer) {
            res.json(retailer);
        } else {
            res.status(404).json({ message: 'Retailer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new retailer
// @route   POST /api/retailers
// @access  Private (Admin/Sales Rep)
const createRetailer = async (req, res) => {
    const { shopName, ownerName, phone, address, gstin, gpsLatitude, gpsLongitude } = req.body;

    try {
        const retailer = await Retailer.create({
            shopName,
            ownerName,
            phone,
            address,
            gstin,
            gpsLatitude,
            gpsLongitude,
        });

        res.status(201).json(retailer);
    } catch (error) {
        res.status(400).json({
            message: error.message,
            details: error.errors?.map(e => e.message) || []
        });
    }
};

// @desc    Update retailer
// @route   PUT /api/retailers/:id
// @access  Private
const updateRetailer = async (req, res) => {
    try {
        const retailer = await Retailer.findByPk(req.params.id);

        if (retailer) {
            retailer.shopName = req.body.shopName || retailer.shopName;
            retailer.ownerName = req.body.ownerName || retailer.ownerName;
            retailer.phone = req.body.phone || retailer.phone;
            retailer.address = req.body.address || retailer.address;
            retailer.gstin = req.body.gstin !== undefined ? req.body.gstin : retailer.gstin;
            retailer.gpsLatitude = req.body.gpsLatitude || retailer.gpsLatitude;
            retailer.gpsLongitude = req.body.gpsLongitude || retailer.gpsLongitude;
            retailer.isActive = req.body.isActive !== undefined ? req.body.isActive : retailer.isActive;

            const updatedRetailer = await retailer.save();
            res.json(updatedRetailer);
        } else {
            res.status(404).json({ message: 'Retailer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete retailer
// @route   DELETE /api/retailers/:id
// @access  Private (Admin)
const deleteRetailer = async (req, res) => {
    try {
        const retailer = await Retailer.findByPk(req.params.id);

        if (retailer) {
            await retailer.destroy();
            res.json({ message: 'Retailer removed' });
        } else {
            res.status(404).json({ message: 'Retailer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRetailers,
    getRetailerById,
    createRetailer,
    updateRetailer,
    deleteRetailer,
};
