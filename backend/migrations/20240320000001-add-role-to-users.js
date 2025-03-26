'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if column exists before adding
        const table = await queryInterface.describeTable('Users');
        if (!table.role) {
            await queryInterface.addColumn('Users', 'role', {
                type: Sequelize.ENUM('user', 'admin'),
                allowNull: false,
                defaultValue: 'user'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Users', 'role');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_role";');
    }
}; 