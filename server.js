const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const contactRoute = require('./routes/contactRoute');

dotenv.config();
// Add to top of server.js

const app = express();
app.use(cors());
app.use(express.json());


const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hotel Booking API is running...');
});

const roomRoutes = require('./routes/roomRoutes');
app.use('/api/rooms', roomRoutes);

const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

const paymentRoutes = require('./routes/paymentRoutes'); 
app.use('/api/payments', paymentRoutes); 
app.use('/uploads', express.static('uploads'));

const availabilityRoutes = require('./routes/availabilityRoutes');
app.use('/api/availability', availabilityRoutes);
app.set('trust proxy', true);


const menuRoutes = require('./routes/menuRoutes');
app.use('/api/menu', menuRoutes);


app.use('/api/contact', contactRoute);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection failed:', err.message);
});
