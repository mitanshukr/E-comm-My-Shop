const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    resetToken: String,
    resetTokenExpiry: Date,
    cart: {
        checkoutToken: String,
        items: [{
            productId: { type: mongoose.Schema.Types.ObjectID, ref: 'Product', required: true},
            qty: {type: Number, required: true}
        }]
    }
});

userSchema.methods.addToCart = function(product) {
    const productIndex = this.cart.items.findIndex(item => {
        return item.productId.toString() === product._id.toString();
    });
    if(productIndex >= 0){
        this.cart.items[productIndex].qty += 1;
    } else {
        const newItem = { productId: product._id, qty: 1 };
        this.cart.items.push(newItem);
    }
    return this.save();
}

userSchema.methods.deleteCartItem = function (prodId) {
    return this
    .execPopulate()
    .then(user => {
        const productIndex = user.cart.items.findIndex(item => {
            item.productId.toString() === prodId;
        });
        user.cart.items.splice(productIndex, 1);
        return user.save();
    });
}

module.exports = mongoose.model('User', userSchema);

// const mongodb = require('mongodb');
// const getdb = require('../utility/database').getDb;

// const Products = require('./product');

// class User {
//     constructor(username, email, userId, cart) {
//         this.name = username;
//         this.email = email;
//         this._id = userId;
//         this.cart = cart; //{items: []}
//     }

//     save() {
//         const db = getdb();
//         return db.collection('users').insertOne(this)
//         .then(result => {
//             // console.log(result);
//         }).catch(err => {
//             console.log(err);
//         });
//     }

//     addToCart(product) {
//         const db = getdb();
//         const productIndex = this.cart.items.findIndex(item => {
//             return item.productId.toString() == product._id.toString();
//         });
//         if(productIndex >= 0){
//             this.cart.items[productIndex].qty += 1;
//         } else {
//             const newItem = { productId: product._id, qty: 1 };
//             this.cart.items.push(newItem);
//         }
//         return db.collection('users').updateOne(
//             { _id: new mongodb.ObjectId(this._id) },
//             {$set: {cart: this.cart}
//         });
//     }

//     getCart() {
//         return Promise.all(this.cart.items.map(async (item) => {
//             const product = await Products.getProductDetail(item.productId);
//             product.qty = item.qty;
//             return product;
//         }));
//     }

//     deleteCartItem(productId) {
//         const db = getdb();
//         const productIndex = this.cart.items.findIndex(item => {
//             return item.productId.toString() == productId.toString();
//         });
//         this.cart.items.splice(productIndex, 1);

//         return db.collection('users').updateOne(
//             { _id: new mongodb.ObjectId(this._id) },
//             {$set: {cart: this.cart}
//         });
//     }

//     addOrder() {
//         const db = getdb();
//         return this.getCart()
//         .then(products => {
//             const order = {
//                 items: products,
//                 user: {
//                     _id: this._id,
//                     name: this.name,
//                 }
//             };
//             return db.collection('orders').insertOne(order);
//         }).then(result => {
//             this.cart = { items:[] };
//             return db.collection('users').updateOne(
//                 { _id: new mongodb.ObjectId(this._id) },
//                 {$set: {cart: this.cart}
//             });
//         });
//     }

//     getOrders() {
//         const db = getdb();
//         return db.collection('orders')
//         .find({'user._id': new mongodb.ObjectId(this._id)})
//         .toArray();
//     }

//     static findById(userId) {
//         const db = getdb();
//         return db.collection('users').findOne({ _id: new mongodb.ObjectId(userId)});
//     }
// }

// module.exports = User;

// // const Sequelize = require('sequelize');

// // const sequelize = require('../utility/database');

// // const User = sequelize.define('user', {
// //     id: {
// //         type: Sequelize.INTEGER,
// //         autoIncrement: true,
// //         allowNull: false,
// //         primaryKey: true,
// //     },
// //     name: {
// //         type: Sequelize.STRING,
// //         allowNull: false,
// //     },
// //     email: {
// //         type: Sequelize.STRING,
// //         allowNull: false
// //     }
// // });

// // module.exports = User;