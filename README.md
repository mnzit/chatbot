# Chatbot Application

This project consists of a frontend application, a backend API, and a chat widget.

## Application Architecture

The application is composed of three main parts: a **Frontend**, a **Backend API**, and a **Chat Widget**.

1.  **Backend (Python/FastAPI)**:
    *   Serves as the core logic hub.
    *   Exposes API endpoints for:
        *   Creating new chat "bots" by processing and storing context (`/create-bot`).
        *   Handling chat messages (`/chat`).
    *   Integrates with:
        *   **SentenceTransformer**: To convert text (bot context, user messages) into numerical embeddings.
        *   **ChromaDB**: A vector database used to store and retrieve relevant context embeddings for each bot, enabling context-aware conversations.
        *   **Google Gemini AI**: The generative AI model used to produce responses based on the user's message and the retrieved context.
    *   Manages environment variables (like API keys) using `.env` files.
    *   Runs on `http://localhost:8000`.

2.  **Frontend (Vite/React)**:
    *   Provides the user interface, likely for managing bots or interacting with a primary chat interface.
    *   Communicates with the Backend API to send requests and receive data.
    *   Runs on `http://localhost:5173`.

3.  **Chat Widget (`chat-widget.js`)**:
    *   A self-contained JavaScript component designed to be easily embedded into any HTML page (e.g., `widget/chat-widget-test.html`).
    *   Handles the UI for the chat box (displaying messages, input field).
    *   Communicates directly with the Backend API (`/chat` endpoint) to send user messages and display bot responses.
    *   Uses `marked.js` to render Markdown in chat responses.

**Simplified Flow:**
*   A user interacts with the **Chat Widget** embedded on a webpage.
*   The Widget sends the user's message to the **Backend API**.
*   The Backend:
    1.  Uses SentenceTransformer to embed the message.
    2.  Queries ChromaDB with this embedding to find relevant stored context for the specific bot.
    3.  Sends the original message and the retrieved context to Google Gemini AI.
    4.  Receives a generated response from Gemini.
*   The Backend sends this response back to the **Chat Widget**.
*   The Widget displays the response to the user.

The **Frontend** application likely serves as a control panel or a more comprehensive interface, possibly for creating/managing the bots whose context is stored in ChromaDB.

## Running the Application

### 1. Backend

The backend is a Python FastAPI application.

-   **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
-   **Install dependencies (if you haven't already):**
    ```bash
    pip install -r requirements.txt
    ```
-   **Run the backend server:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

    ```
    The backend will typically run on `http://localhost:8000`.

### 2. Frontend

The frontend is a Vite application.

-   **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
-   **Install dependencies (if you haven't already):**
    ```bash
    npm install
    ```
-   **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will typically run on `http://localhost:5173`.

### 3. Chat Widget

The chat widget (`widget/chat-widget.js`) is designed to be embedded in HTML pages. You can test it using the `widget/chat-widget-test.html` file by opening it in a browser. Ensure the backend is running for the widget to communicate with the API.