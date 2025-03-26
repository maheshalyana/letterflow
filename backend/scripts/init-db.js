require('dotenv').config();
const { Sequelize } = require('sequelize');

async function initializeDatabase() {
    const adminSequelize = new Sequelize('postgres', process.env.DB_USER, process.env.DB_PASSWORD, {
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
}

initializeDatabase(); 