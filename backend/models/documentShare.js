const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DocumentShare extends Model {
        static associate(models) {
            // Define associations here if needed
        }
    }

    DocumentShare.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
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
    }, {
        sequelize,
        modelName: 'DocumentShare',
    });

    return DocumentShare;
}; 