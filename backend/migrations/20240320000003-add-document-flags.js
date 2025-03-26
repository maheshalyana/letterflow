'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if columns exist before adding
        const table = await queryInterface.describeTable('Documents');

        if (!table.isArchived) {
            await queryInterface.addColumn('Documents', 'isArchived', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            });
        }

        if (!table.isPublic) {
            await queryInterface.addColumn('Documents', 'isPublic', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Documents', 'isArchived');
        await queryInterface.removeColumn('Documents', 'isPublic');
    }
}; 