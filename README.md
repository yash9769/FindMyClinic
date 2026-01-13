# 🏥 FindMyClinic - Modern Healthcare Management System

![FindMyClinic Banner](docs/images/banner.png)

## 🌟 Overview

**FindMyClinic** is a state-of-the-art healthcare platform designed to bridge the gap between patients and medical providers. Built with a focus on speed, accessibility, and AI integration, it offers a seamless experience for finding clinics, joining virtual queues, and analyzing symptoms.

---

## 🚀 Key Features

### 📋 Smart Appointment & Queue Management
*   **Live Queue Tracking**: Real-time updates on your position in the clinic queue.
*   **Digital Token System**: Join queues remotely and save time.
*   **Clinic Discovery**: Find the best clinics near you with detailed doctor profiles.

### 🧠 AI-Powered Healthcare Assistant
*   **Symptom Analysis**: Intelligent analysis of symptoms using advanced LLMs (OpenAI/Gemini).
*   **Specialist Recommendations**: Get suggested medical specialists based on your symptoms.
*   **Health Chatbot**: 24/7 AI-driven support for basic medical inquiries.

### 👤 Patient-Centric Dashboard
*   **Medical Records**: Securely store and access your medical history.
*   **Personalized Profiles**: Manage your health data and preferences in one place.
*   **Responsive UI**: Optimized for mobile, tablet, and desktop views.

### 🏥 For Clinics
*   **Patient Management**: Streamlined dashboard for doctors to manage their patient flow.
*   **Queue Control**: Real-time management of patient tokens and wait times.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, TypeScript |
| **Styling** | Tailwind CSS, Framer Motion, Radix UI |
| **State Management** | TanStack Query (React Query) |
| **Backend/DB** | Supabase (PostgreSQL), Drizzle ORM |
| **AI Integration** | OpenAI SDK, Google Generative AI |
| **Routing** | Wouter |
| **Forms** | React Hook Form, Zod |

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm
- A Supabase account
- OpenAI API Key

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/FindMyClinic.git
    cd FindMyClinic
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add the following:
    ```env
    DATABASE_URL=your_postgresql_url
    OPENAI_API_KEY=your_openai_api_key
    VITE_OPENAI_API_KEY=your_openai_api_key
    ```

4.  **Database Migration**
    ```bash
    npm run db:push
    ```

5.  **Run Locally**
    ```bash
    npm run dev
    ```

---

## 📂 Project Structure

```text
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application views/routes
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/          # Utility functions and API clients
│   │   └── index.css    # Global styles & Tailwind config
├── supabase/            # Database schema and configurations
├── shared/              # Shared types and validation schemas
└── docs/                # Project documentation and assets
```

---

## 🎨 UI/UX Highlights
- **Glassmorphism**: Elegant, semi-transparent UI elements.
- **Micro-interactions**: Smooth transitions and hover effects using Framer Motion.
- **Dark Mode Support**: Seamless theme switching for better accessibility.

---

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by the FindMyClinic Team
</p>