// I have added Comments for better Understanding 

// Import necessary modules
const express = require('express'); // Express framework for building the server
const dotenv = require('dotenv'); // dotenv for loading environment variables from .env file
const session = require('express-session'); // Session management for OAuth
const googleRoutes = require('./routes/google'); // Routes for handling Google OAuth
const outlookRoutes = require('./routes/outlook'); // Routes for handling Outlook OAuth
const emailQueue = require('./bull/bullQueue'); // BullMQ setup for task scheduling

// Express Setup: 

// Load environment variables
dotenv.config(); // Load the .env file where credentials and secrets are stored

const app = express(); // Initialize the express app
const PORT = process.env.PORT || 3000; // Define the port from environment or default to 3000

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Session secret for security
    resave: false, // Don't save session if it wasn't modified
    saveUninitialized: true, // Save new sessions that haven't been modified yet
    cookie: { secure: false } // Disable secure cookies for local development
}));

// Middleware to parse incoming JSON and URL-encoded requests
app.use(express.json()); // Parses incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// Define routes for OAuth authentication
app.use('/auth', googleRoutes); // Routes for Google authentication
app.use('/authoutlook', outlookRoutes); // Routes for Outlook authentication

// Initialize the email queue for processing tasks
emailQueue; // Utilizing BullMQ for asynchronous email handling, which enhances performance when processing multiple emails.

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`); // Log message once the server is up and running
});


