# 🤖 How the Chatbot Works (Internal Documentation)

This document explains the "brains" of the chatbot project in simple terms, covering how it stores information and how it answers questions.

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

## 📁 4. Project Structure (For Techies)
*   `backend/main.py`: The brain. Handles API requests and Gemini integration.
*   `backend/chroma_db/`: The physical files where the memory is stored.
*   `widget/chat-widget.js`: The frontend script you embed on other sites.
*   `frontend/`: The dashboard you use to create and manage your bots.

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

## 🚀 Summary for Laymen
Imagine a librarian who has a photographic memory but only for the books you give them. When you ask a question, the librarian finds the right page in their memory, reads it, and then explains the answer to you in natural English. **That is exactly what this project does.**
