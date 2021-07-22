const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    items: [ {type: Object, ref: 'User.cart.items'}],
    user: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        email: { type: String, ref:'User'}
    }
});

module.exports = mongoose.model('Order', orderSchema);