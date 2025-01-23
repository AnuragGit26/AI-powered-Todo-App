# Todo List Application

A simple and intuitive Todo List application built with React and TypeScript. This application allows users to manage their tasks efficiently with features like theme customization and authentication via Supabase.

## Features

- **Todo Management**: Add, edit, and delete tasks.
- **Theme Customization**: Switch between light and dark modes, and customize primary and secondary colors.
- **Authentication**: Sign in with email/password or GitHub using Supabase.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/your-username/todo-list-app.git
    cd todo-list-app
    ```

2. Install dependencies:
    ```sh
    npm install
    # or
    yarn install
    ```

3. Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your-supabase-url
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

### Running the Application

Start the development server:
```sh
npm run dev
# or
yarn dev
