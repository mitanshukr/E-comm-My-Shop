const express = require('express');
const path = require('path');

const router = express.Router();

const isAuth = require('../middleware/is-auth');    //check if the user is loggedin or not!
const adminControl = require('../controllers/adminControl');

router.get('/products', isAuth, adminControl.getAdminProducts); //code execution left to right

// /admin/add-product => GET
router.get('/add-product', isAuth, adminControl.getAddProduct);
// /admin/add-product => POST
router.post('/add-product', isAuth, adminControl.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminControl.getEditProduct);
router.post('/edit-product', isAuth, adminControl.postEditProduct);

// router.post('/delete-item', isAuth, adminControl.deleteProduct);
router.delete('/delete-item/:productId', isAuth, adminControl.deleteProduct);


module.exports = router;