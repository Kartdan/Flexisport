# FlexiSport

A sports court booking and community platform. Court owners can list and manage courts, players can book and review them, supervisors moderate content, and admins oversee everything.

**Stack:** Angular 17 · Node/Express · MongoDB (Atlas) · JWT auth · Nodemailer

---

## Running locally (development)

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# 1. Install root dev tools
npm install

# 2. Install backend dependencies
cd flexisport-backend && npm install && cd ..

# 3. Install frontend dependencies
cd flexisport-frontend && npm install && cd ..

# 4. Create backend environment file
cp flexisport-backend/.env.example flexisport-backend/.env
# Edit flexisport-backend/.env and fill in your values (see Environment Variables below)

# 5. Start both backend and frontend together
npm start
```

The app will be available at **http://localhost:4200**. The backend runs on port 5000 and the Angular dev server proxies all `/api/*` requests to it automatically.

To run them separately:
```bash
npm run backend    # starts backend only (with nodemon auto-reload)
npm run frontend   # starts frontend only
```

---

## Running with Docker

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) with Docker Compose

### Setup

```bash
# 1. Create the root environment file
cp flexisport-backend/.env.example .env
# Edit .env and fill in your values (see Environment Variables below)

# 2. Build and start
sudo docker compose up --build
```

The app will be available at **http://localhost:4200**.

```bash
# Stop
sudo docker compose down

# Stop and remove all stored data (volumes)
sudo docker compose down -v

# View logs (when running detached)
sudo docker compose logs -f
```

> **Note:** After adding yourself to the `docker` group (`sudo usermod -aG docker $USER`), log out and back in to run `docker compose` without `sudo`.

---

## Environment Variables

The backend requires a `.env` file. Copy the example and fill in your values:

```bash
cp flexisport-backend/.env.example flexisport-backend/.env  # for local dev
cp flexisport-backend/.env.example .env                     # for Docker
```

| Variable | Description | Required |
|---|---|---|
| `MONGO_URI` | MongoDB connection string (Atlas or local) | ✅ |
| `JWT_SECRET` | Secret key for signing JWT tokens — use a long random string | ✅ |
| `PORT` | Port the backend listens on (default: 5000) | ❌ |
| `MAIL_HOST` | SMTP host for sending contact emails (e.g. `smtp.gmail.com`) | ❌ |
| `MAIL_PORT` | SMTP port (default: 587) | ❌ |
| `MAIL_USER` | SMTP username / email address | ❌ |
| `MAIL_PASS` | SMTP password or app password | ❌ |

> Mail variables are optional — if left blank, contact messages are saved to the database but no email is sent.

### MongoDB Atlas setup
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write access
3. Whitelist your IP (or `0.0.0.0/0` for Docker)
4. Copy the connection string into `MONGO_URI`

---

## Project Structure

```
flexisport-backend/     Express API
  routes/               API route handlers
  models/               Mongoose models
  middleware/           Auth + upload middleware
  uploads/              Uploaded court/avatar images (persisted via Docker volume)
  .env.example          Environment variable template

flexisport-frontend/    Angular 17 app
  src/app/
    components/         UI components
    services/           HTTP services
    guards/             Route guards
    interfaces.ts       Shared TypeScript interfaces
  proxy.conf.json       Dev server API proxy config
  nginx.conf            nginx config used inside Docker

docker-compose.yml      Runs backend + frontend containers
```

---

## User Roles

| Role | Capabilities |
|---|---|
| **Player** | Browse courts, book, review, register for tournaments |
| **Owner** | Create and manage courts and tournaments, view bookers |
| **Supervisor** | Approve/reject courts, moderate posts/reviews/Q&A, personal inbox, dashboard |
| **Admin** | Full access — all supervisor capabilities plus user management, analytics, all inboxes |
