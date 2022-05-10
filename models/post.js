const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            date : {
                type : Sequelize.DATE,
                allowNull : false,
            },
            weather :{
                type : Sequelize.STRING(10),
                allowNull : false,
            },
            
            area1 : {
                type : Sequelize.STRING(10),
                allowNull : false,
            },
            area2 : {
                type : Sequelize.STRING(10),
                allowNull : false,
            },
            content : {
                type : Sequelize.STRING(1000),
                allowNull : false,
            }
        }, {
            sequelize,
            timestamps : false,
            underscored : false,
            modelName : 'Post',
            tableName : 'posts',
            paranoid : false,
            charset : 'utf8',
            collate : 'utf8_general_ci'
        });
    }
    static associate(db) {
        db.Post.belongsTo(db.User);
    }
};