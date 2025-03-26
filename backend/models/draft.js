const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Draft extends Model {
        static associate(models) {
            Draft.belongsTo(models.Document, { foreignKey: 'documentId' });
            Draft.belongsTo(models.User, { foreignKey: 'userId', targetKey: 'uid' });
        }
    }

    Draft.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
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
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        savedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Draft',
        timestamps: true
    });

    return Draft;
}; 