// Import necessary modules
const { Router } = require('express'); // Router for defining routes
const { google } = require('googleapis'); // Google APIs client library
const { saveGmailToken } = require('../utils/tokenManager'); // Function to save the Gmail token

require('dotenv').config();

// Create a new router instance
const router = Router();

// Initialize the OAuth2 client with client ID, secret, and redirect URI
const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID || `YOUR-GMAIL_CLIENT_ID`, // Client ID from environment variables or fallback
    process.env.GMAIL_CLIENT_SECRET || `YOUR-CLIENT-SECRET`, // Client secret from environment variables or fallback
    process.env.GMAIL_REDIRECT_URI || `YOUR-LINK` // Redirect URI after authentication
);

// Route for initiating the Google OAuth flow
router.get('/google', (req, res) => {
    // Generate the authorization URL for Google OAuth
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request offline access to get a refresh token
        scope: [
            'https://www.googleapis.com/auth/gmail.readonly', // Scope for reading emails
            'https://www.googleapis.com/auth/gmail.send', // Scope for sending emails
        ],
    });
    res.redirect(authUrl); // Redirect user to Google for authentication
});

// Route for handling the OAuth2 callback
router.get('/oauth2callback', async (req, res) => {
    const { code } = req.query; // Get the authorization code from query parameters
    const { tokens } = await oauth2Client.getToken(code); // Exchange the authorization code for tokens
    oauth2Client.setCredentials(tokens); // Set the retrieved tokens in the OAuth2 client

    req.session.googleTokens = tokens; // Save tokens in the session

    saveGmailToken(tokens); // Save tokens using the utility function

    console.log("Google tokens saved:", tokens); // Log the saved tokens for debugging

    res.send('Google account connected successfully!'); // Send response to user
});

// Export the router for use in the main application
module.exports = router;
