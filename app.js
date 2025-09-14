require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const bcrypt = require('bcryptjs');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// EJS Layout setup
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const User = mongoose.model("User", userSchema);

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Login routes
app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.render('register', {
        error: 'Passwords do not match',
        email: email,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', {
        error: 'Email already registered',
        email: email,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    // Send welcome email
    const mailOptions = {
      to: user.email,
      subject: 'Welcome to Password Reset System',
      html: `
        <h2>Welcome to Password Reset System</h2>
        <p>Your account has been successfully created.</p>
        <p>If you ever forget your password, you can use our password reset system.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.render('register', {
      success:
        'Registration successful! You can now use the password reset system.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', {
      error: 'Error during registration. Please try again.',
      email: req.body.email,
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
