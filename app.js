const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/password-reset'
  )
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
