const express = require('express');
const connectDB = require('./config/db');
const Routes = require('./routes/routes');
const cors = require('cors');
const rateLimiter = require('./middlewares/rateLimiter');


const app = express();

connectDB();
app.use(cors());
app.use(express.json());

// Apply rate limiter middleware
app.use(rateLimiter({
    maxRequests: 100,       // Allow 100 requests
    windowMs: 60 * 1000,    // In a 1-minute window
    keyPrefix: 'rate-limit' // Prefix for Redis keys
}));

app.use('/api/', rateLimiter, Routes);

// Your routes here
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});