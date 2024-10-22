// Import necessary modules from BullMQ and IORedis
const { Queue, Worker } = require('bullmq'); // BullMQ for job queueing
const IORedis = require('ioredis'); // Redis client for Node.js
const { readGmailEmails, readOutlookEmails, processGmailEmail, processOutlookEmail } = require('../controllers/emailController'); // Email processing functions
const { getGmailToken, getOutlookToken } = require('../utils/tokenManager'); // Token retrieval functions

// Initialize Redis connection
// Queue Initialization: "Initializes a BullMQ job queue for email processing."

const connection = new IORedis({
    maxRetriesPerRequest: null, // Disable retries for failed requests
});

// Create a new BullMQ queue named 'emailQueue'
const emailQueue = new Queue('emailQueue', { connection });

// Create a new worker to process jobs from the 'emailQueue'
// Worker Setup: "Listens for jobs and processes them based on email type."
// Email Processing: "Processes new emails by calling respective functions."
const worker = new Worker('emailQueue', async (job) => {
    const { type } = job.data; // Extract the type of email from the job data

    if (type === 'gmail') {
        const gmailTokens = getGmailToken(); // Retrieve Gmail tokens
        if (!gmailTokens) {
            console.error('No Gmail tokens available.'); // Log if no tokens are available
            return; // Exit if no tokens
        }
        // Read Gmail emails
        const gmailEmails = await readGmailEmails(gmailTokens);
        // Process each Gmail email
        for (const email of gmailEmails) {
            await processGmailEmail(gmailTokens, email);
        }
    } else if (type === 'outlook') {
        const outlookTokens = getOutlookToken(); // Retrieve Outlook tokens
        if (!outlookTokens) {
            console.error('No Outlook tokens available.'); // Log if no tokens are available
            return; // Exit if no tokens
        }
        // Read Outlook emails
        const outlookEmails = await readOutlookEmails(outlookTokens);
        // Process each Outlook email
        for (const email of outlookEmails) {
            await processOutlookEmail(outlookTokens, email);
        }
    }
}, { connection });

// Event listener for completed jobs
// Job Events: "Logs job completion and failure events for monitoring."
worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`); // Log when a job completes
});

// Event listener for failed jobs
worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error: ${err.message}`); // Log error details for failed jobs
});
// Job Scheduling: "Schedules jobs every minute to check for new emails."
// Function to schedule jobs in the queue
async function scheduleJobs() {
    const gmailTokens = getGmailToken(); // Retrieve Gmail tokens
    if (gmailTokens) {
        const gmailEmails = await readGmailEmails(gmailTokens); // Read Gmail emails
        if (gmailEmails.length > 0) {
            await emailQueue.add('gmailJob', { type: 'gmail' }); // Add a job for Gmail if there are new emails
        }
    }

    const outlookTokens = getOutlookToken(); // Retrieve Outlook tokens
    if (outlookTokens) {
        const outlookEmails = await readOutlookEmails(outlookTokens); // Read Outlook emails
        if (outlookEmails.length > 0) {
            await emailQueue.add('outlookJob', { type: 'outlook' }); // Add a job for Outlook if there are new emails
        }
    }
}

// Schedule jobs to run every minute
setInterval(scheduleJobs, 60000); // Call scheduleJobs every 60 seconds

// Export the email queue for use in other modules
module.exports = emailQueue;
