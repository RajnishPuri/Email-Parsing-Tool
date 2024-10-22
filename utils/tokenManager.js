// Object to store OAuth tokens for Gmail and Outlook

const tokens = {
    gmail: null,  // Placeholder for Gmail OAuth token
    outlook: null, // Placeholder for Outlook OAuth token
};

// Save the Gmail OAuth token
function saveGmailToken(token) {
    tokens.gmail = token;  // Assign the token to the gmail property
}

// Save the Outlook OAuth token
function saveOutlookToken(token) {
    tokens.outlook = token;  // Assign the token to the outlook property
}

// Retrieve the Gmail OAuth token
function getGmailToken() {
    return tokens.gmail;  // Return the stored Gmail token
}

// Retrieve the Outlook OAuth token
function getOutlookToken() {
    return tokens.outlook;  // Return the stored Outlook token
}

// Export functions for use in other parts of the application
module.exports = {
    saveGmailToken,
    saveOutlookToken,
    getGmailToken,
    getOutlookToken,
};
