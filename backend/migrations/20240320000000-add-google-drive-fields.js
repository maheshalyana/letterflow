'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Documents', 'driveFileId', {
            type: Sequelize.STRING,
            allowNull: true
        });

        await queryInterface.addColumn('Documents', 'driveLink', {
            type: Sequelize.STRING,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Documents', 'driveFileId');
        await queryInterface.removeColumn('Documents', 'driveLink');
    }
}; 