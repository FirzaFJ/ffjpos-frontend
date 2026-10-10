# 🛒 FFJ Mart POS - Frontend (React + Vite)

Welcome to the **FFJ Mart Point of Sale (POS)** frontend repository. This application serves as the interactive user interface for managing sales transactions, inventory, product catalogs, and real-time reporting for the FFJ Mart store.

The project is built using modern web standards with **React** and **Vite**, designed to be fast, responsive, and decoupled from the backend infrastructure. It communicates seamlessly with the Laravel REST API hosted on InfinityFree.

---

## 🌟 Key Features

- **Point of Sale Interface:** Fast and intuitive checkout workflow designed for cashier efficiency.
- **Product & Category Management:** Real-time search, filtering, and stock visibility.
- **Cart & Order Processing:** Dynamic cart state management with automatic price and tax calculations.
- **Responsive Layout:** Optimized for desktop screens, tablets, and mobile touch displays.
- **Asynchronous API Integration:** Built using Axios with centralized error handling and state feedback.

---

## 🛠️ Tech Stack & Dependencies

- **Core Library:** [React](https://react.dev/) (v18+)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Styling:** CSS3 / Modern Utility Styling
- **Alerts & UI Notifications:** SweetAlert2 / Custom Modals
- **Hosting Platform:** [Vercel](https://vercel.com/)

---

## ⚙️ Environment Variables Configuration

The frontend relies on environment variables to establish connectivity with the backend REST API. 

Create a `.env` file in the root of the `pos-frontend` directory:

```env
# URL target of the Laravel API hosted on InfinityFree
VITE_API_BASE_URL=https://ffjmart-backend.wuaze.com/api
```

> **Important:** Always ensure the protocol is set to `https://` to avoid Mixed Content security errors when deployed on Vercel.

---

## 🚀 Local Development Setup

Follow these steps to run the frontend application locally on your machine:

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)

### 2. Installation
Clone the repository and install the project dependencies:

```bash
git clone https://github.com/FirzaFJ/pos-frontend.git
cd pos-frontend
npm install
```

### 3. Running Development Server
Start the Vite local development server:

```bash
npm run dev
```
By default, the application will be accessible at `http://localhost:5173`.

### 4. Production Build Verification
To test the production build locally before deploying:

```bash
npm run build
npm run preview
```

---

## 🌐 Deployment Guidelines (Vercel)

This frontend is configured for deployment on **Vercel**:

1. Push your repository to **GitHub**.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import the `pos-frontend` repository.
4. Set the project configuration as follows:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL` = `https://ffjmart-backend.wuaze.com/api`
6. Click **Deploy**.

---

## 📁 Project Structure

```text
pos-frontend/
├── public/              # Static assets (favicons, icons)
├── src/
│   ├── api/             # Axios instance & centralized API request handlers
│   ├── assets/          # Stylesheets and media assets
│   ├── components/      # Reusable UI components (Buttons, Inputs, Cards)
│   ├── context/         # React Context API for global state (Cart, Auth)
│   ├── pages/           # Application views (POS, Dashboard, Inventory)
│   ├── utils/           # Helper utilities (Formatters, SweetAlert wrappers)
│   ├── App.jsx          # Main App component & route structure
│   └── main.jsx         # Application entry point
├── .env                 # Local environment variables
├── package.json         # Project metadata and dependencies
└── vite.config.js       # Vite configuration file
```

---

## 📜 License

This project is maintained and owned by **FFJ**.