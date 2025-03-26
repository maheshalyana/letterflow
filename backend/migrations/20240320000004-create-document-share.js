'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('DocumentShares', {
            documentId: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
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
                primaryKey: true,
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
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add unique constraint instead of separate primary key
        await queryInterface.addConstraint('DocumentShares', {
            fields: ['documentId', 'userId'],
            type: 'unique',
            name: 'document_shares_unique'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeConstraint('DocumentShares', 'document_shares_unique');
        await queryInterface.dropTable('DocumentShares');
    }
}; 