# Todo AI App

A simple and intuitive Todo List application built with React and TypeScript. This application allows users to manage their tasks efficiently with features like theme customization and authentication via Supabase.

## Features

- **Task Management**: Create, edit, and organize your todos with priorities and due dates
- **AI-Powered Analysis**: Get intelligent insights and suggestions for your tasks
- **Subtasks**: Break down complex tasks into manageable subtasks
- **Pomodoro Timer**: Built-in focus timer with cross-device synchronization
  - Pause/Resume functionality that works across all screens
  - Real-time sync across multiple devices for the same account
  - Session history and customizable settings
  - Visual and audio notifications
- **Analytics Dashboard**: Track your productivity trends and task completion rates
- **Theme Customization**: Personalize your experience with custom themes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Sync**: All your data syncs across devices in real-time

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

## Pomodoro Timer

The integrated Pomodoro timer helps you maintain focus and productivity:

### Key Features:
- **Cross-Device Sync**: Timer state syncs automatically across all your devices
- **Proper Pause/Resume**: Timer can be paused and resumed without resetting
- **Mini Timer**: Compact timer display in the navigation bar when active
- **Full Timer Page**: Dedicated page with detailed settings and controls
- **Session Tracking**: Automatic tracking of work sessions and breaks
- **Customizable Settings**: Adjust work time, break durations, and intervals
- **Smart Notifications**: Browser notifications and audio alerts
- **Auto-start Options**: Automatically start next sessions if desired

### Usage:
1. Navigate to the Pomodoro page or start from the mini timer in the nav bar
2. Set your work session label (what you're working on)
3. Click Start to begin a 25-minute work session
4. Use Pause/Resume to control the timer without losing progress
5. Timer automatically switches between work and break periods
6. View your session history and productivity stats

The timer state is automatically synchronized across all your devices, so you can start a session on your computer and continue on your phone seamlessly.
