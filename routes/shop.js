const express = require('express');
const path = require('path');

const router = express.Router();

const isAuth = require('../middleware/is-auth');    //check if the user is loggedin or not!
const shopControl = require('../controllers/shopControl');

router.get('/', shopControl.renderHome);
router.get('/products', shopControl.getProducts);
router.get('/products/:productId', shopControl.renderProductDetail);

router.get('/cart', isAuth, shopControl.renderCart);    //execution from left to right!
router.post('/cart', isAuth, shopControl.postCart);
router.post('/delete-cart-item', isAuth, shopControl.deleteItemFromCart);

router.get('/checkout', isAuth, shopControl.getCheckout);
router.get('/checkout/success/:checkoutToken', isAuth, shopControl.postOrder);
router.get('/checkout/cancel', isAuth, shopControl.getCheckout);

// router.post('/create-order', isAuth, shopControl.postOrder); 
router.get('/orders', isAuth, shopControl.getOrders);
router.get('/orders/:orderId', isAuth, shopControl.getInvoice);


module.exports = router;