# Ad Screener 

Ad Screener is a full-stack web application designed to streamline the process of Ad submission and review. Submitters can upload advertisements, and reviewers can approve or reject them based on established guidelines.

## ✨ Key Features

*   **User Authentication:** Secure login and registration for submitters and reviewers using NextAuth.
*   **Role-Based Access Control:** Distinct dashboards and functionalities for submitters and reviewers.
*   **Ad Submission:** Submitters can create and submit new advertisements.
*   **Ad Review Workflow:** Reviewers can view pending ads, approve, or reject them.
*   **Dashboard:** Overview of Ad statuses, user activity, and other relevant metrics.
*   **User Profiles & Settings:** Manage user profiles and application settings.
*   **Notifications:** In-app notifications for important events.

## 🛠️ Tech Stack

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) (React Framework)
    *   [React](https://reactjs.org/)
    *   [Tailwind CSS](https://tailwindcss.com/)
    *   [Radix UI](https://www.radix-ui.com/) (for UI components)
    *   [Shadcn/ui](https://ui.shadcn.com/) (likely, given Radix and Tailwind)
    *   [TanStack Query](https://tanstack.com/query/latest) (for data fetching and state management)
    *   [TypeScript](https://www.typescriptlang.org/)
*   **Backend:**
    *   Next.js API Routes
    *   [NextAuth.js](https://next-auth.js.org/) (Authentication)
*   **Database:**
    *   [MongoDB](https://www.mongodb.com/) (with Mongoose or MongoDB Node.js Driver)
*   **Form Handling:**
    *   [React Hook Form](https://react-hook-form.com/)
    *   [Zod](https://zod.dev/) (for schema validation)
*   **Other:**
    *   [Axios](https://axios-http.com/) (for HTTP requests)
    *   [Lucide React](https://lucide.dev/) (for icons)
    *   [Sonner](https://sonner.emilkowal.ski/) (for toasts/notifications)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm] (or pnpm/yarn, though `pnpm-lock.yaml` is present)
*   A running [MongoDB](https://www.mongodb.com/try/download/community) instance or a MongoDB Atlas account.

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Ad-screener
    ```

2.  **Install dependencies:**
    If you have pnpm:
    ```bash
    pnpm install
    ```
    Or using npm:
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project by copying the `.env.example` (if one exists, otherwise create it from scratch).
    You'll need to configure at least the following:
    ```env
    # MongoDB
    MONGODB_URI=your_mongodb_connection_string

    # NextAuth
    NEXTAUTH_URL=http://localhost:6999 # Or your development port
    NEXTAUTH_SECRET=your_super_secret_nextauth_key # Generate a strong secret

    # Other variables (e.g., API keys for email services, payment gateways if used)
    # PAYSTACK_SECRET_KEY=... (if Paystack integration is fully set up)
    # EMAIL_SERVER_USER=...
    # EMAIL_SERVER_PASSWORD=...
    # EMAIL_FROM=...
    ```
    *Note: The `dev` script runs on port `6999`.*

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    Or using npm:
    ```bash
    npm run dev
    ```
    The application should now be running at [http://localhost:6999](http://localhost:6999).

## 📜 Available Scripts

In the project directory, you can run the following commands:

*   `pnpm dev` or `npm run dev`: Runs the app in development mode on port 6999.
*   `pnpm build` or `npm run build`: Builds the app for production.
*   `pnpm start` or `npm run start`: Starts the production server.
*   `pnpm lint` or `npm run lint`: Lints the project files.

## 🏗️ Project Structure (Simplified)

```
Ad-screener/
├── app/                  # Next.js App Router: Pages, API routes, layouts
│   ├── api/              # Backend API routes
│   ├── (roles)/          # Route groups for different user roles (e.g., reviewer, submitter)
│   └── page.tsx          # Main landing page
│   └── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/           # Shared UI components
│   └── ui/               # Shadcn/ui components (likely)
├── contexts/             # React Context API providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions, configurations, database connections
├── public/               # Static assets
├── scripts/              # Utility scripts (e.g., seeding data)
├── styles/               # Global styles (if any beyond app/globals.css)
├── types/                # TypeScript type definitions
├── .env.local            # Local environment variables (ignored by Git)
├── next.config.mjs       # Next.js configuration
├── package.json          # Project metadata and dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## 🙌 Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and create a pull request, or open an issue for discussion.

---

_This README was generated with assistance from an AI._
