# LetterFlow

LetterFlow is a real-time collaborative document editing platform built with React, Node.js, and PostgreSQL. It features Google Drive integration, real-time collaboration, and a rich text editor.

## Features

- 📝 Real-time collaborative document editing
- 🔄 Google Drive integration for document storage
- 👥 Document sharing and permissions management
- 🎨 Rich text editor with formatting options
- 🔐 Google authentication
- 💾 Automatic saving
- 📱 Responsive design

## Tech Stack

### Frontend
- React
- Redux Toolkit for state management
- TipTap for rich text editing
- Tailwind CSS for styling
- Y.js for real-time collaboration
- Firebase Authentication
- Vite for build tooling

### Backend
- Node.js & Express
- PostgreSQL with Sequelize ORM
- WebSocket for real-time communication
- Google Drive API integration
- Firebase Admin SDK

### Infrastructure
- Docker & Docker Compose
- Nginx for reverse proxy
- SSL/TLS support

## Prerequisites

- Node.js (v20 or later)
- Docker and Docker Compose
- PostgreSQL
- Google Cloud Platform account with Drive API enabled
- Firebase project

## Environment Variables

### Frontend (.env)
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
DEV=true/false
```

### Backend (.env)
```env
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_HOST=localhost
PORT=3003
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/letterflow.git
cd letterflow
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up the database:
```bash
cd backend
npm run init-db
npm run migrate
```

4. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server
cd frontend
npm run dev
```

## Docker Deployment

1. Build and start the containers:
```bash
docker-compose up -d
```

2. Run database migrations:
```bash
docker-compose exec backend npm run migrate
```

## Project Structure

```
letterflow/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── public/
│   └── vite.config.js
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── migrations/
│   └── config/
└── docker-compose.yml
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Acknowledgments

- [TipTap](https://tiptap.dev/) for the rich text editor
- [Y.js](https://yjs.dev/) for real-time collaboration
- [Tailwind CSS](https://tailwindcss.com/) for styling
