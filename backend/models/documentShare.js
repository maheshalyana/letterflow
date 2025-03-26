const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const DocumentShare = sequelize.define('DocumentShare', {
        documentId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Documents',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'uid'
            }
        },
        role: {
            type: DataTypes.ENUM('editor', 'viewer'),
            defaultValue: 'editor',
            allowNull: false
        }
    });

    return DocumentShare;
}; 