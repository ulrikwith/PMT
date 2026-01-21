# Project Management Tool (PMT)

A modern, full-stack project management application designed to interface with the Blue.cc platform. This project serves as a robust prototype for a personalized productivity environment, featuring a resilient backend architecture that ensures continuous operation even when external API services are unavailable.

## 🚀 Technology Stack

The application is built using a modern JavaScript/TypeScript stack, separated into a distinct frontend and backend.

### **Frontend**
*   **React (v18):** UI library for building a responsive and interactive component-based interface.
*   **Vite:** Next-generation build tool for lightning-fast development and optimized production builds.
*   **Axios:** Promise-based HTTP client for seamless communication with the backend.
*   **CSS/Styling:** Clean, modular styling for a distraction-free user experience.

### **Backend**
*   **Node.js & Express:** Lightweight and flexible server framework to handle API requests.
*   **GraphQL Request:** A minimal GraphQL client to interface with the Blue.cc API.
*   **Dotenv:** Environment variable management for secure credential storage.
*   **CORS:** Middleware to enable secure cross-origin resource sharing between frontend and backend.

---

## 🔗 The Blue.cc API Backbone

This application is architected to be a custom interface for [Blue.cc](https://blue.cc), a powerful project management platform. Instead of building a database from scratch, PMT leverages Blue.cc's GraphQL API as its primary data store.

### **Integration Architecture**
The backend (`blueClient.js`) acts as a proxy and translation layer:
1.  **Schema Mapping:** It translates generic concepts like "Tasks" and "Workspaces" into Blue.cc's specific "Todos" and "Projects" schema.
2.  **Auto-Provisioning:** The system intelligently checks if the user has an existing workspace. If not, it automatically provisions a **Company**, **Project**, and **Todo List** via the API, ensuring a zero-setup experience for new users.

### **Resilient "Hybrid" Data Strategy**
To ensure reliability, we implemented a robust **Fall-Back Mechanism**:
*   **The Challenge:** External APIs can have strict permissioning, rate limits, or provisioning delays (e.g., a newly created company not being immediately accessible).
*   **The Solution:** The backend employs an **In-Memory Store** alongside the API connection.
    *   When the Blue.cc API is reachable and authorized, data flows directly to/from the cloud.
    *   If the API denies access or fails (e.g., during complex provisioning states), the system seamlessly switches to the local in-memory store.
    *   **Result:** The user experiences **zero downtime**. You can create, view, and manage tasks immediately, regardless of the upstream API status.

---

## 🌟 Potential for a Personalized PM Tool

This project represents the foundation of a bespoke "OS for Work." By building your own PM tool instead of using off-the-shelf software, you unlock significant advantages:

### **1. Workflow Customization**
*   **Specialized Automations:** You can write backend logic to trigger specific actions (e.g., "When I finish a task, send a Slack message" or "Auto-archive tasks after 7 days").
*   **Custom Views:** Break free from standard Kanban or List views. You could build a "Focus Mode" that shows only one task at a time, or a "Matrix View" for Eisenhower prioritization.

### **2. Data Sovereignty & Aggregation**
*   **Unified Dashboard:** Since the backend is yours, you can pull in data from *other* sources (GitHub PRs, Jira tickets, Google Calendar events) and display them side-by-side with your Blue.cc tasks.
*   **Private Notes:** Store sensitive personal notes in a local database (SQLite/Postgres) that never touches the external cloud API, while keeping public tasks synced.

### **3. Rapid Prototyping**
*   **Experimentation:** Want to try a new productivity method like Pomodoro or Time Blocking? You can code it into the frontend in an afternoon without waiting for a feature request to be approved by a SaaS vendor.

---

## 🛠️ Getting Started

### **Prerequisites**
*   Node.js (v18 or higher recommended)
*   npm (Node Package Manager)

### **Installation**

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd PMT
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    # Create .env file with your Blue.cc credentials
    # BLUE_TOKEN_ID=...
    # BLUE_SECRET_ID=...
    ```

3.  **Setup Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

### **Running the Application**

1.  **Start the Backend:**
    ```bash
    cd backend
    npm run dev
    # Runs on http://localhost:3001
    ```

2.  **Start the Frontend:**
    ```bash
    cd frontend
    npm run dev
    # Runs on http://localhost:5173 (or similar)
    ```

3.  Open your browser to the frontend URL to start managing your projects!

---

## 📄 License
[MIT](LICENSE)