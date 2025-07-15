# Tactical Intellect: AI Chess App

This is a feature-rich chess application built with Next.js, Firebase, and Genkit. It allows users to play against a configurable AI bot, challenge friends in online multiplayer matches, or enjoy a "Pass & Play" mode on a single device.

## Features

- **Multiple Game Modes:**
  - **Play vs. Bot:** Challenge an AI with adjustable difficulty levels, from Beginner to Full Power AI.
  - **Play vs. Friend (Online):** Create a game lobby, share a code, and play against friends in real-time.
  - **Pass & Play:** Two players can play on the same device.
- **AI-Powered Assistance:**
  - **Analyze Position:** Get a grandmaster-level analysis of the current board state.
  - **Get Hint:** Receive a suggested move and the reasoning behind it from the AI.
- **Firebase Integration:**
  - **GitHub Authentication:** Securely log in using your GitHub account.
  - **Real-time Firestore:** Powers the online multiplayer experience, ensuring seamless gameplay.
- **Modern Tech Stack:**
  - **Next.js & React:** For a fast and responsive user interface.
  - **TypeScript:** For robust, type-safe code.
  - **ShadCN UI & Tailwind CSS:** For beautiful, modern components and styling.
  - **Genkit (Gemini):** For all generative AI features.

## Getting Started

To run this project locally, you will need to set up your own Firebase project and create a `.env.local` file with the necessary Firebase configuration keys.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/abhi1248859/pro_Chess.git
    cd pro_Chess
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
