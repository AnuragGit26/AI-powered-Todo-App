# Todo AI App

A simple and intuitive Todo List application built with React and TypeScript. This application allows users to manage their tasks efficiently with features like theme customization and authentication via Supabase.

## Features

- **Todo Management**: Add, edit, and delete tasks.
- **Theme Customization**: Switch between light and dark modes, and customize primary and secondary colors.
- **Authentication**: Sign in with email/password or GitHub using Supabase.
- **AI Integration**: Powered by Google's Gemini API for enhanced task management.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase
- **State Management**: Zustand
- **AI**: Google Gemini API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/your-username/todo-ai-app.git
    cd todo-ai-app
    ```

2. Install dependencies:
    ```sh
    npm install
    # or
    yarn install
    ```

3. Create a `.env` file in the root directory with the required environment variables:
    ```
    # Copy from .env.example and fill with your own values
    cp .env.example .env
    ```

### Running the Application

Start the development server:
```sh
npm run dev
# or
yarn dev
```

## Deployment to Netlify

This project is configured for easy deployment to Netlify with automatic deployments from GitHub.

### Setup Steps

1. Fork or push this repository to your GitHub account
2. Connect your GitHub repository to Netlify:
   - Log in to Netlify
   - Click "New site from Git"
   - Select GitHub and authorize Netlify
   - Choose your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. Configure Environment Variables:
   - In Netlify dashboard, go to Site settings > Build & deploy > Environment
   - Add the following environment variables:
     ```
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
     VITE_GEMINI_API_KEY
     VITE_SUPABASE_SECRET_KEY
     ```

4. Deploy:
   - Netlify will automatically build and deploy your site
   - Any future changes pushed to your main branch will trigger automatic redeployments

### Continuous Deployment

With GitHub integration, Netlify will automatically:
- Build and deploy when you push to your main branch
- Create deploy previews for pull requests
- Allow you to roll back to previous deployments if needed

## Security Considerations

- Never commit `.env` files to your repository
- Use Netlify's environment variables for all sensitive information
- Consider using Netlify's branch deploy settings to control which branches trigger deployments
