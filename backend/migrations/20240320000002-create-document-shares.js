'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('DocumentShares')) {
            await queryInterface.createTable('DocumentShares', {
                documentId: {
                    type: Sequelize.UUID,
                    primaryKey: true,
                    references: {
                        model: 'Documents',
                        key: 'id'
                    },
                    onDelete: 'CASCADE'
                },
                userId: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: {
                        model: 'Users',
                        key: 'uid'
                    },
                    onDelete: 'CASCADE'
                },
                role: {
                    type: Sequelize.ENUM('viewer', 'editor'),
                    allowNull: false,
                    defaultValue: 'viewer'
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

            // Add indexes for better query performance
            await queryInterface.addIndex('DocumentShares', ['documentId']);
            await queryInterface.addIndex('DocumentShares', ['userId']);
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('DocumentShares');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DocumentShares_role";');
    }
}; 