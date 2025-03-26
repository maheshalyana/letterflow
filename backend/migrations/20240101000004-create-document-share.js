'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('DocumentShares', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            documentId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Documents',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
            role: {
                type: Sequelize.ENUM('editor', 'viewer'),
                defaultValue: 'editor',
                allowNull: false
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

        // Add a unique constraint to prevent duplicate shares
        await queryInterface.addConstraint('DocumentShares', {
            fields: ['documentId', 'userId'],
            type: 'unique',
            name: 'unique_document_user_share'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('DocumentShares');
    }
}; 