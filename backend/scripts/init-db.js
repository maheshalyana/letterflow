require('dotenv').config();
const { Sequelize } = require('sequelize');
const { exec } = require('child_process');
const path = require('path');

async function initializeDatabase() {
    const adminSequelize = new Sequelize('postgres', process.env.DB_USERNAME, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: 'postgres'
    });

    try {
        // Create database if it doesn't exist
        await adminSequelize.query(`CREATE DATABASE ${process.env.DB_NAME};`);
        console.log('Database created successfully');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('Database already exists');
        } else {
            console.error('Error creating database:', error);
        }
    } finally {
        await adminSequelize.close();
    }

    // Run migrations using sequelize-cli
    console.log('Running migrations...');
    exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
        if (error) {
            console.error(`Migration error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Migration stderr: ${stderr}`);
            return;
        }
        console.log(`Migration stdout: ${stdout}`);
        console.log('Database migrations completed successfully');
    });
}

initializeDatabase();