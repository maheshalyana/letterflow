require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { sequelize, User } = require('./models');
const documentsRouter = require('./routes/documents');
const { setupWebSocketServer } = require('./websocket');
const http = require('http');
const { authenticateToken } = require('./middleware/auth');

// Initialize Firebase Admin
const serviceAccount = require("./firebase-admin.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = setupWebSocketServer(server);

app.use(cors());
app.use(express.json());

// Verify Firebase Token and manage user data
app.post("/verify-token", async (req, res) => {
    const { token } = req.body;
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Find or create user in database
        const [user, created] = await User.findOrCreate({
            where: { uid: decodedToken.uid },
            defaults: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name || decodedToken.email.split('@')[0],
                picture: decodedToken.picture,
                lastLogin: new Date()
            }
        });

        // Update last login if user already exists
        if (!created) {
            await user.update({
                lastLogin: new Date(),
                name: decodedToken.name || user.name,
                picture: decodedToken.picture || user.picture,
                email: decodedToken.email
            });
        }

        res.json({
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                name: user.name,
                picture: user.picture,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ success: false, error: "Invalid token" });
    }
});

// Get user profile
app.get("/users/:uid", async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uid: req.params.uid },
            attributes: ['uid', 'email', 'name', 'picture', 'lastLogin']
        });

        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Update user profile
app.put("/users/:uid", async (req, res) => {
    try {
        const user = await User.findOne({ where: { uid: req.params.uid } });

        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        await user.update(req.body);
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Apply authentication middleware to /api routes
app.use('/api', authenticateToken);
app.use('/api/documents', documentsRouter);

// Initialize database and start server
const PORT = process.env.PORT || 3003;

// Sync database models before starting the server
sequelize.sync({ alter: true })
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Database synced');
        });
    })
    .catch(err => {
        console.error('Unable to sync database:', err);
    });