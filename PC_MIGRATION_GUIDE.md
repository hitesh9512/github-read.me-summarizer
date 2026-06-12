# 🚀 Moving & Running `proj-1` on a New PC

If you are moving this project folder (`proj-1`) to another computer that natively has **Node.js, npm, and PostgreSQL** installed, follow these exact steps to cleanly boot everything up. 

---

## 🛑 Important: The `node_modules` Rule

If you copied the whole folder from your old PC using a USB drive or local network transfer, **do not skip this step**. 

> **Why?** Prisma downloads a unique query engine strictly based on the operating system it is installed on. Moving compiled binaries between computers will crash the backend.

1. Navigate into `proj-1/backend` and delete the `node_modules` folder.
2. Navigate into `proj-1/frontend` and delete the `node_modules` folder.

*(If you clone directly from GitHub without the `node_modules` included, you skip this).*

---

## 🗄️ Step 1: Database Setup

Your new computer's Postgres installation is currently empty. 
1. Open your Postgres management tool (like pgAdmin or `psql`).
2. Create a new database matching the name in your `.env` file (e.g., `github_summarizer`).
3. Ensure the username and password in `backend/.env` match the PostgreSQL credentials configured for this new computer:
   ```env
   # Make sure this matches your new PC's postgres user/password
   DATABASE_URL="postgresql://username:password@localhost:5432/github_summarizer"
   ```

---

## ⚙️ Step 2: Booting the Backend

Now you need to install standard dependencies and push your database layout.

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd path/to/proj-1/backend
   ```
2. Install fresh, OS-specific dependencies:
   ```bash
   npm install
   ```
3. Generate the Prisma Client for your specific PC:
   ```bash
   npx prisma generate
   ```
4. Push your Prisma database schema directly into the empty Postgres database you created:
   ```bash
   npx prisma db push
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
*(Your server should now be live on `http://localhost:4000`)*

---

## 🎨 Step 3: Booting the Frontend

With your server running tightly and connected to Postgres, boot up the UI.

1. Open a **new, split terminal** and navigate to the frontend folder:
   ```bash
   cd path/to/proj-1/frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

**🎉 You're done! Your full-stack project is now flawlessly running natively entirely on your new computer.**
