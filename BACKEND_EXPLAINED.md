# 🤖 How the Chatbot Works (Internal Documentation)

This document explains the "brains" of the chatbot project in simple terms, covering how it stores information and how it answers questions.

---

## 🚀 Getting Started

To get the project up and running quickly, use the provided automation scripts:

### 1. First Time Setup
Run the setup script to create a virtual environment, install Python dependencies, and set up the Node.js frontend:
```bash
./setup.sh
```

### 2. Running the Servers
Once setup is complete, you can start both the Backend (FastAPI) and Frontend (Vite) with a single command:
```bash
./run.sh
```
*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend/Widget**: [http://localhost:8000](http://localhost:8000)
*   **Press `Ctrl + C`** to gracefully stop both servers.

---

## 🏗️ The Big Picture
The project is split into three main parts:
1.  **The Backend (FastAPI)**: The "Server" that does all the thinking.
2.  **The Database (ChromaDB)**: The "Memory" where information is stored.
3.  **The Widget (JavaScript)**: The "Interface" that users see on a website.

---

## 🧠 1. How the Memory Works (Vector Database)
Unlike a regular database that stores text in rows (like Excel), this project uses a **Vector Database**.

### The "Slicing" Process:
When you create a bot and give it context (like a Wikipedia article):
1.  **Text to Numbers**: The backend takes your text and uses a machine learning model (`all-MiniLM-L6-v2`) to turn it into a long list of numbers called an **Embedding**.
2.  **Coordinates**: Think of these numbers as coordinates on a giant map. Similar ideas are placed close together on this map.
3.  **Storage**: These "coordinates" are saved in **ChromaDB**.

---

## 💬 2. How the Chatting Works (RAG - Retrieval Augmented Generation)
When a user asks a question, the backend follows these 4 steps:

### Step 1: Searching the Map
The backend turns the user's question into coordinates (numbers). It then looks at its "memory map" (ChromaDB) to see which piece of stored context is closest to that question.

### Step 2: Grabbing the Context
It picks the most relevant snippet of information. For example, if the question is "Who is Buddha?" and you uploaded a life story, it finds the paragraphs mentioning his birth and teachings.

### Step 3: Asking the Expert (Gemini AI)
The backend then sends a package to **Google Gemini AI**. This package looks like this:
> "Hey Gemini, here is some **Context**: [The snippets we found]. Based ONLY on this info, please answer this **Question**: Who is Buddha?"

### Step 4: Delivering the Answer
Gemini reads the context and the question, then writes a human-like reply. The backend sends this reply back to the chat widget for the user to see.

---

## 🛠️ 3. The Chat Widget
The `chat-widget.js` is a "plugin" that can be added to any website.
*   **Loading**: It looks for a `data-bot-id` on the script tag. This tells it which "Memory Collection" to talk to in the backend.
*   **Styling**: It generates its own HTML/CSS dynamically so it doesn't need external stylesheets.
*   **Markdown**: It includes a library called `marked.js` so that if the bot answers with **bold text**, lists, or `code blocks`, they look beautiful.

---

## 🏛️ 4. Modular Architecture & SOLID

To ensure the project is scalable and professional, we refactored the backend into a modular architecture following **SOLID** principles. The code is organized into a standard Python web application structure:

### 📁 Detailed File Breakdown
*   **`backend/app/main.py`**: The entry point. It initializes the database, configures CORS, and wires together all the different API modules.
*   **`backend/app/core/`**: 
    *   `config.py`: Centralized settings using Pydantic. It handles everything from API keys to folder paths.
    *   `security.py`: Logic for hashing passwords and generating secure JWT (JSON Web Token) access keys.
*   **`backend/app/db/`**:
    *   `session.py`: Handles the connection to your **MySQL** database and provides a "Session" to other parts of the app.
*   **`backend/app/models/`**: 
    *   The "Database Blueprints". Defines the `User` and `Bot` tables for MySQL.
*   **`backend/app/schemas/`**: 
    *   The "Data Filters". These ensure that whatever data comes from the user (like an email or a message) is correctly formatted before the app processes it.
*   **`backend/app/services/`**:
    *   `ai_service.py`: A specialized worker that only talks to **Google Gemini**.
    *   `vector_service.py`: A worker that manages **ChromaDB** and the text-to-coordinates transformation.
*   **`backend/app/api/`**:
    *   `endpoints/auth.py`: Handles registration and logging in.
    *   `endpoints/bots.py`: Handles creating and listing your custom chatbots.
    *   `endpoints/chat.py`: Handles the actual messaging logic.

### 📂 Deep Dive: File-by-File Explanation

If you open the `backend/app` folder, here is exactly what each file is doing:

#### 1. `app/main.py`
The **Command Center**. It creates the FastAPI "application" object, connects the database, sets up security rules (CORS), and mounts the "Widget" folder so it can be served as a website. It "includes" all other routers so the API knows which URLs exist.

#### 2. `app/core/` (The Vital Organs)
*   **`config.py`**: The **Standardized Settings**. It reads your `.env` file and converts those text strings into Python objects that the rest of the app can easily use (like your Gemini API key or Database URL).
*   **`security.py`**: The **Shield**. It contains the logic to lock doors (create JWT tokens) and check IDs (verify passwords).

#### 3. `app/db/` (The Foundation)
*   **`session.py`**: The **Database Connector**. It creates the "Engine" that talks to MySQL. It also provides the `get_db` function, which is used throughout the app to open and close database connections safely.

#### 4. `app/models/` (The Identity)
*   **`user.py` & `bot.py`**: The **Table Definitions**. These files tell MySQL exactly how to create the `users` and `bots` tables. They define that a "User" has an email and a password, and a "Bot" has a name and belongs to a specific User.

#### 5. `app/schemas/` (The Translators)
*   **`user.py`, `bot.py`, `token.py`**: The **Data Enforcers**. While `models` are for the database, `schemas` are for the API. They ensure that if a user tries to register with a missing password, the system stops them before the database ever gets involved.

#### 6. `app/services/` (The Workers)
*   **`ai_service.py`**: The **AI Specialist**. It encapsulates all the logic for communicating with Google Gemini.
*   **`vector_service.py`**: The **Librarian**. It handles the heavy lifting of turning text into numbers (Embeddings) and saving/searching them in ChromaDB.

#### 7. `app/api/` (The Interface)
*   **`deps.py`**: The **Traffic Controller**. It contains helper functions used by routes, like `get_current_user`, which checks if someone is logged in before letting them see their bots.
*   **`endpoints/`**:
    *   `auth.py`: Handles `/register` and `/token` (Login).
    *   `bots.py`: Handles `/bots` (Creating and listing your bots).
    *   `chat.py`: Handles `/chat` (The actual AI messaging loop).

### 📐 SOLID Principles Applied
1.  **Single Responsibility Principle (SRP)**:
    *   Every file has one job. `ai_service.py` handles AI, `security.py` handles security. If you want to change your database, you only ever touch the `db/` folder.
2.  **Open/Closed Principle**:
    *   The architecture is "Open for extension". If you want to add a "Voice Recognition" feature, you simply add a new service and a new API file without breaking the existing Chat logic.
3.  **Interface Segregation**:
    *   The frontend only sees the "Schemas" it needs. It doesn't need to know how the vector database works internally; it just sends a message and gets a reply.
4.  **Dependency Inversion**:
    *   We use **Dependency Injection** (via FastAPI's `Depends`). This means the API routes "ask" for a database session rather than creating one themselves, making the code much easier to test and manage.

---

## 🔬 Technical Algorithms

For those who want to know the "math" behind the magic, here are the specific algorithms used:

### 1. Text Embedding: Transformer Model
The system uses the **`all-MiniLM-L6-v2`** model. 
*   **How it works**: This is a mini Transformer model trained on over 1 billion sentence pairs.
*   **Output**: It converts any piece of text (up to 256 words) into a **384-dimensional vector** (a list of 384 specific numbers).
*   **Why?**: It is extremely fast and accurate at understanding the semantic meaning of short sentences.

### 2. Similarity Search: Cosine Similarity
To find the right context, the system calculates the "distance" between the user's question and the stored data.
*   **Algorithm**: **Cosine Similarity**.
*   **Concept**: It measures the angle between two vectors. If the angle is 0, the sentences are identical in meaning. If the angle is 90 degrees, they are unrelated.
*   **Search**: ChromaDB uses **HNSW (Hierarchical Navigable Small World)** indexing to search through millions of stored snippets in milliseconds.

### 3. Answer Generation: Large Language Model (LLM)
The final step uses the **`gemini-flash-latest`** model from Google.
*   **Type**: A generative pretrained transformer.
*   **Process**: It uses **In-Context Learning**. By providing the retrieved snippets inside the prompt, we "steer" the model to behave like a specialist assistant rather than a general-purpose AI.

---

## 🚀 Summary for Laymen
Imagine a librarian who has a photographic memory but only for the books you give them. When you ask a question, the librarian finds the right page in their memory, reads it, and then explains the answer to you in natural English. **That is exactly what this project does.**
