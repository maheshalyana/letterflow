'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Make content nullable for draft support
        await queryInterface.changeColumn('Documents', 'content', {
            type: Sequelize.TEXT,
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('Documents', 'content', {
            type: Sequelize.TEXT,
            allowNull: false,
            defaultValue: ''
        });
    }
}; 