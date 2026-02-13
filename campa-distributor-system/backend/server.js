const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./models');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const retailerRoutes = require('./routes/retailerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Campa Distributor System API Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', require('./routes/invoiceRoutes'));

// Database Connection & Sync
// Database Connection & Sync
if (require.main === module) {
  db.sequelize.sync({ force: false }) // Set force: true to drop tables and recreate
    .then(() => {
      console.log('Database connected and synced');
      // Start Server only after DB sync
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Error syncing database:', err);
    });
}

module.exports = app;
