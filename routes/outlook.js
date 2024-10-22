// Import necessary modules
const { Router } = require('express'); // Router for defining routes
const fetch = require('isomorphic-fetch'); // Fetch API for making HTTP requests
const { saveOutlookToken } = require('../utils/tokenManager'); // Function to save the Outlook token

// Create a new router instance
const router = Router();

// Configuration for Outlook OAuth
const outlookConfig = {
    client_id: process.env.OUTLOOK_CLIENT_ID || `YOUR-CLIENT-ID`, // Client ID from environment variables or fallback
    client_secret: process.env.OUTLOOK_CLIENT_SECRET || `YOUR-CLIENT-SECRET`, // Client secret from environment variables or fallback
    redirect_uri: process.env.OUTLOOK_REDIRECT_URI || `YOUR-LINK`, // Redirect URI after authentication
    scopes: ['offline_access', 'Mail.ReadWrite', 'Mail.Send'], // Scopes for the permissions requested
};

// Route for initiating the Outlook OAuth flow
router.get('/outlook', (req, res) => {
    // Construct the authorization URL
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${outlookConfig.client_id}&response_type=code&redirect_uri=${outlookConfig.redirect_uri}&response_mode=query&scope=${outlookConfig.scopes.join(' ')}`;
    res.redirect(authUrl); // Redirect user to Outlook for authentication
});

// Route for handling the OAuth2 callback
router.get('/oauth2callback', async (req, res) => {
    const { code } = req.query; // Get the authorization code from query parameters

    // Create a body for the token request
    const body = new URLSearchParams({
        client_id: outlookConfig.client_id, // Include client ID
        client_secret: outlookConfig.client_secret, // Include client secret
        code, // Include authorization code
        grant_type: 'authorization_code', // Specify the grant type
        redirect_uri: outlookConfig.redirect_uri, // Include the redirect URI
    });

    // Make a POST request to get tokens
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        body: body.toString(), // Send the body as URL-encoded data
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // Set content type for request
    });

    const tokens = await response.json(); // Parse the JSON response
    req.session.outlookTokens = tokens; // Save tokens in the session
    saveOutlookToken(tokens); // Save tokens using the utility function

    console.log("Outlook tokens saved:", tokens); // Log the saved tokens for debugging

    res.send('Outlook account connected successfully!'); // Send response to user
});

// Export the router for use in the main application
module.exports = router;
