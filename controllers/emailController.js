// Import necessary modules
const { google } = require('googleapis'); // Google APIs client library
const { Client } = require('@microsoft/microsoft-graph-client'); // Microsoft Graph client library
const openai = require('../utils/openAI'); // OpenAI utility for generating responses

// User email addresses for reference
const YOUR_GMAIL_ADDRESS = 'your_gmail@example.com'; // Replace with your actual Gmail address
const YOUR_OUTLOOK_ADDRESS = 'your_outlook@example.com'; // Replace with your actual Outlook address

// Set to track processed email IDs to avoid duplicate processing
let processedEmailIds = new Set();
// Variable to store server start time
let serverStartTime;

// Initialization: "Manages email reading and processing logic for Gmail and Outlook." 

// Function to initialize the server start time
function initServerStartTime() {
    serverStartTime = new Date(); // Store the current time as server start time
}

// Reading Emails: "Fetches the latest emails from Gmail and Outlook."

// Function to read emails from Gmail
async function readGmailEmails(tokens) {
    const oauth2Client = new google.auth.OAuth2(); // Create a new OAuth2 client
    oauth2Client.setCredentials(tokens); // Set the OAuth2 credentials
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client }); // Initialize Gmail API client

    // Fetch the latest 10 messages, excluding those sent by the user
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: '-from:me', // Query to exclude messages from the user
        maxResults: 10
    });

    const messages = res.data.messages || []; // Get messages or an empty array if none
    const newMessages = []; // Array to hold new messages

    // Check timestamps and filter new messages
    for (const message of messages) {
        const msgDetails = await gmail.users.messages.get({ userId: 'me', id: message.id }); // Get details of each message
        const emailTimestamp = new Date(parseInt(msgDetails.data.internalDate)); // Parse the internal date

        // If the email is received after the server start time, add it to new messages
        if (emailTimestamp > serverStartTime) {
            newMessages.push(message);
        }
    }

    return newMessages; // Return the new messages
}

// Function to read emails from Outlook
async function readOutlookEmails(tokens) {
    // Initialize Microsoft Graph client with the provided access token
    const client = Client.init({
        authProvider: (done) => done(null, tokens.access_token),
    });

    // Fetch the latest 10 messages from Outlook
    const res = await client.api('/me/messages').top(10).get();

    // Filter messages based on their received date
    const newMessages = res.value.filter(message => {
        const emailTimestamp = new Date(message.receivedDateTime);
        return emailTimestamp > serverStartTime; // Keep only recent messages
    });

    return newMessages; // Return the new messages
}

// Email Categorization: "Uses regex patterns to categorize emails."

// Function to categorize an email based on its content
function categorizeEmail(emailContent) {
    // Define regex patterns for categorizing email content
    const interestedRegex = /\b(interested|want to buy|buy now|yes|definitely|count me in|sign me up)\b/i;
    const notInterestedRegex = /\b(not interested|no thanks|unsubscribe|do not want|stop|not for me)\b/i;
    const moreInfoRegex = /\b(more information|tell me more|details|info|i need more|can you elaborate)\b/i;

    // Return category based on the content of the email
    if (notInterestedRegex.test(emailContent)) {
        return 'Not Interested';
    }
    if (interestedRegex.test(emailContent)) {
        return 'Interested';
    }
    if (moreInfoRegex.test(emailContent)) {
        return 'For More Information';
    }
    return 'Uncategorized'; // Default category if no patterns match
}

// Function to send a response email using Gmail
async function sendGmailResponse(gmail, response, recipientEmail) {
    // Create the email object with base64-encoded content
    const email = {
        raw: Buffer.from(`To: ${recipientEmail}\nSubject: Re: Your Email\n\n${response}`).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    };

    // Send the email using the Gmail API
    await gmail.users.messages.send({ userId: 'me', requestBody: email });
    console.log('Gmail email sent successfully!'); // Log success message
}

// Processing Emails: "Handles processing logic, checking for duplicates and sender accounts."
// Sending Responses: "Generates and sends replies using OpenAI."


// Function to process a Gmail email
async function processGmailEmail(tokens, email) {
    try {
        const oauth2Client = new google.auth.OAuth2(); // Create a new OAuth2 client
        oauth2Client.setCredentials(tokens); // Set the OAuth2 credentials

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client }); // Initialize Gmail API client
        const message = await gmail.users.messages.get({ userId: 'me', id: email.id }); // Get message details

        const emailContent = message.data.snippet; // Extract the email content snippet
        const headers = message.data.payload.headers; // Extract headers

        // Find the sender's email address from the headers
        const fromHeader = headers.find(header => header.name === 'From');
        const senderEmail = fromHeader ? fromHeader.value : '[Unknown Sender]';

        console.log(`Email received from: ${senderEmail}`); // Log sender's email

        // Check if the email has already been processed
        if (processedEmailIds.has(email.id)) {
            console.log(`Email with ID ${email.id} has already been processed. Skipping.`);
            return;
        }

        // Skip emails sent by the linked account to avoid auto-replies
        if (senderEmail.includes(YOUR_GMAIL_ADDRESS)) {
            console.log(`Received email from the linked account. Skipping.`);
            return;
        }

        processedEmailIds.add(email.id); // Mark the email as processed

        const category = categorizeEmail(emailContent); // Categorize the email
        console.log(`Email categorized as: ${category}`); // Log the category

        // Generate an appropriate response using OpenAI
        const response = await openai.generateResponse(category);

        // Send the generated response to the sender
        await sendGmailResponse(gmail, response, senderEmail);
    } catch (error) {
        console.error(`Failed to process Gmail email with ID ${email.id}: ${error.message}`); // Log error message
        console.error('Full error details:', error); // Log full error details
        if (error.code === 403) {
            console.error('Possible cause: Insufficient permissions. Check your OAuth scopes.'); // Suggest checking permissions
        }
    }
}

// Function to process an Outlook email
async function processOutlookEmail(tokens, email) {
    try {
        // Initialize Microsoft Graph client with the provided access token
        const client = Client.init({
            authProvider: (done) => done(null, tokens.access_token),
        });

        const message = await client.api(`/me/messages/${email.id}`).get(); // Get message details
        const emailContent = message.body.content; // Extract email body content

        const senderEmail = message.from.emailAddress.address; // Get sender's email address

        console.log(`Outlook email received from: ${senderEmail}`); // Log sender's email

        // Skip emails sent by the linked account
        if (senderEmail === YOUR_OUTLOOK_ADDRESS) {
            console.log(`Skipping email from ${YOUR_OUTLOOK_ADDRESS} to avoid replying to yourself.`);
            return;
        }

        // Check if the email has already been processed
        if (processedEmailIds.has(email.id)) {
            console.log(`Email with ID ${email.id} has already been processed. Skipping.`);
            return;
        }

        processedEmailIds.add(email.id); // Mark the email as processed

        const emailTimestamp = new Date(message.receivedDateTime); // Get the email's received timestamp
        // Skip emails received before the server started
        if (emailTimestamp <= serverStartTime) {
            console.log(`Outlook email received before server start time. Skipping.`);
            return;
        }

        const category = categorizeEmail(emailContent); // Categorize the email
        console.log(`Email categorized as: ${category}`); // Log the category

        // Generate an appropriate response using OpenAI
        const response = await openai.generateResponse(category);

        try {
            await sendOutlookResponse(client, senderEmail, response); // Send response to the sender
            console.log(`Outlook reply sent to: ${senderEmail}`); // Log success message
        } catch (error) {
            if (error.code === 'ErrorExceededMessageLimit') {
                console.error('Daily message limit exceeded. Cannot send email.'); // Handle limit exceeded error
            } else {
                throw error; // Rethrow other errors
            }
        }
    } catch (error) {
        console.error(`Failed to process Outlook email with ID ${email.id}: ${error.message}`); // Log error message
        console.error('Full error details:', error); // Log full error details
    }
}

// Function to send a response email using Outlook
async function sendOutlookResponse(client, recipientEmail, response) {
    if (recipientEmail === YOUR_OUTLOOK_ADDRESS) {
        console.log('Not sending email to self:', recipientEmail); // Skip sending email to self
        return;
    }

    // Create the email object for sending
    const email = {
        subject: "Re: Your Email", // Subject of the reply
        body: {
            contentType: "Text", // Content type of the body
            content: response // Body content with the response
        },
        toRecipients: [
            {
                emailAddress: {
                    address: recipientEmail // Recipient email address
                }
            }
        ]
    };

    // Send the email using Microsoft Graph API
    await client.api('/me/sendMail').post({ message: email });
    console.log('Outlook email sent successfully to:', recipientEmail); // Log success message
}

// Initialize server start time
initServerStartTime();

// Export functions for use in other modules
module.exports = {
    readGmailEmails,
    readOutlookEmails,
    processGmailEmail,
    processOutlookEmail,
};
