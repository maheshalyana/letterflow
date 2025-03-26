'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Documents', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            userId: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'uid'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'Untitled'
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            lastModified: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            isArchived: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            isPublic: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            driveFileId: {
                type: Sequelize.STRING,
                allowNull: true
            },
            driveLink: {
                type: Sequelize.STRING,
                allowNull: true
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Documents');
    }
}; 