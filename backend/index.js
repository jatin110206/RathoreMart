const express  = require("express");
const cors     = require("cors");
const dotenv   = require("dotenv");
const dns      = require("dns");
const connectDB = require("./config/db");

// Force IPv4 DNS resolution first to prevent ENETUNREACH errors on cloud hosts like Render
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();
connectDB();

const app = express();

// ── CORS configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];

if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',').forEach(url => {
        const clean = url.trim().replace(/\/+$/, '');
        if (clean && !allowedOrigins.includes(clean)) allowedOrigins.push(clean);
    });
}

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, '');
        // Allow localhost, any *.vercel.app domain, or explicitly configured FRONTEND_URL
        if (allowedOrigins.includes(cleanOrigin) || /\.vercel\.app$/.test(cleanOrigin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Rejected origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
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
