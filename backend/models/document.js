const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Document extends Model {
        static associate(models) {
            Document.belongsTo(models.User, { foreignKey: 'userId', targetKey: 'uid', as: 'owner' });
            Document.hasMany(models.Draft, { foreignKey: 'documentId' });
            Document.belongsToMany(models.User, {
                through: models.DocumentShare,
                as: 'sharedWith',
                foreignKey: 'documentId'
            });
        }
    }

    Document.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'uid'
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Untitled'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        lastModified: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        isArchived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        driveFileId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        driveLink: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Document',
        timestamps: true
    });

    return Document;
}; 