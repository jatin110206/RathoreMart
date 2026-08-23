const express  = require("express");
const cors     = require("cors");
const dotenv   = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// ── CORS — allow Vite dev server ──────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("rathoreMart backend is running ✅");
});

app.use('/api/auth',      require('./routes/authRoutes.js'));
app.use('/api/products',  require('./routes/productRoutes.js'));
app.use('/api/orders',    require('./routes/orderRoutes.js'));
app.use('/api/payment',   require('./routes/paymentRoutes.js'));
app.use('/api/analytics', require('./routes/analyticsRoutes.js'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`rathoreMart server running on http://localhost:${PORT}`);
});
