# Email Parsing Tool

This is an email parsing tool that connects to Gmail and Outlook using OAuth, reads incoming emails, categorizes them based on the content, and sends automated replies. The tool utilizes OpenAI to generate appropriate responses for each email category. The tool also prevents sending replies to emails from the user's own account.

## Features

- **OAuth Authentication**: Connects to Gmail and Outlook using OAuth tokens.
- **Email Parsing**: Reads emails from both Gmail and Outlook, filtering out old emails and those sent from the user's account.
- **Email Categorization**: Categorizes emails based on their content into the following categories:
  - `Interested`
  - `Not Interested`
  - `For More Information`
  - `Uncategorized`
- **Automated Responses**: Generates automated replies using OpenAI and sends them to the email sender.
- **Processed Email Tracking**: Tracks processed emails to avoid reprocessing the same email multiple times.

## Project Structure

├── bull/  
│ └── bullQueue.js # Handles queueing logic using Bull  
├── controllers/  
│ └── emailController.js # Email handling logic (send, receive, categorize, respond)  
├── routes/  
│ ├── google.js # Google OAuth routes and logic  
│ └── outlook.js # Outlook OAuth routes and logic  
├── utils/  
│ ├── openAI.js # Utility for generating responses using OpenAI API  
│ └── tokenManager.js # Manages token storage and refresh logic  
├── index.js # Main entry point for the server

## Setup

### Prerequisites

1. **Node.js**: Ensure that you have Node.js installed. You can download it from [here](https://nodejs.org).
2. **OAuth Tokens**: You will need OAuth credentials for both Gmail and Outlook APIs.
   - [Gmail OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
   - [Outlook OAuth Setup Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
3. **OpenAI API Key**: Sign up for OpenAI and generate an API key from [here](https://beta.openai.com/signup/).

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/RajnishPuri/Email-Parsing-Tool.git
   cd Email-Parsing-Tool

   ```

2. Install dependencies:
   npm install

### .env file

Create a `.env` file in the root directory and add the following environment variables:

```env
GMAIL_CLIENT_ID=your-gmail-client-id

GMAIL_CLIENT_SECRET=your-gmail-client-secret

GMAIL_REDIRECT_URI=your-gmail-redirect-uri


OUTLOOK_CLIENT_ID=your-outlook-client-id

OUTLOOK_CLIENT_SECRET=your-outlook-client-secret

OUTLOOK_REDIRECT_URI=your-outlook-redirect-uri


OPENAI_API_KEY=your-openai-api-key
```

### Start the Server

node index.js
