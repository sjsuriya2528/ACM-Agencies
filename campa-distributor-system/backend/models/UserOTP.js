module.exports = (sequelize, DataTypes) => {
    const UserOTP = sequelize.define('UserOTP', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
            onDelete: 'CASCADE',
            field: 'user_id'
        },
        otpCode: {
            type: DataTypes.STRING(6),
            allowNull: false,
            field: 'otp_code'
        },
        purpose: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'expires_at'
        },
        attemptCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'attempt_count'
        },
        isUsed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_used'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        tableName: 'user_otps',
        timestamps: false, // We are handling created_at manually to match SQL
    });

    return UserOTP;
};
