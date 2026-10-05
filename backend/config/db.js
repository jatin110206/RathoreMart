const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        // Do not call process.exit(1) so Express server remains healthy and can retry
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;