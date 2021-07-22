const mongoose = require('mongoose');

// const rootDir = require('../utility/path');
const fileHelper = require('../utility/file');
const Products = require('../models/product');

exports.getAdminProducts = (req, res, next) => {
    Products.find({userId: req.user._id})
    // .select('title price -_id')     //explicitly mention what to output or what to not! _id is always outputted until explicitly minus-ed
    // .populate('userId', 'name')     //If you notice, we have only userId in our product data, but We can get full user data with the help of .populate(userId)
    .then(products => {
        res.render('admin/products', {products, pageTitle: 'Admin - Product' });
    }).catch(err => {
        console.log(err);
    });
}

exports.getAddProduct = (req, res, next) => {
    // if(!req.session.user) {
    //     return res.redirect('/login');
    // }
    res.render("admin/edit-product", {
      pageTitle: "Add Product 🛒",
      editMode: false,
      hasError: false,
      errorMessage: req.flash('error'), //not needed
      products: {}, //not needed
    });
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'));  //No Template Engines
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const image = req.file;
    // console.log(image);
    if (!image) {
      return res
        .status(422)
        .render("admin/edit-product", {
          pageTitle: "Add Product 🛒",
          editMode: false,
          hasError: true,
          errorMessage: 'Invalid Image format.',
          product: { title, price, description },
        });
    }
    const imageUrl = '\\images\\' + image.filename;    //  '\\' + image.path;  
    const product = new Products({title, price, description, imageUrl, userId: req.user});  //userId should be req.user._id (to be precise), but mongoose is smart enough to pick the user._id automatically!
    product.save()
    .then(result => {
        // console.log(result);
        res.redirect('/admin/products');
    }).catch(err => {
        // console.log(err);
        res.status(500).redirect('/500');
    });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;      //true    url.com/xyz?edit=true
    if(!editMode) {
        res.send('Something went Wrong!');
    }
    const productId = req.params.productId;
    Products.findById(productId).then((product) => {
        res.render('admin/edit-product', {product, pageTitle: 'Edit Product 🛒', editMode, hasError: false, errorMessage: '' });
    }).catch(err => {
        console.log(err);
    });
    //parameter is enough to get product detail, query is added for learning purpose only.
};

exports.postEditProduct = (req, res, next) => {
    const productId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    const updatedImage = req.file;
    Products.findById(productId)
    .then((product) => {
        // throw new Error('dummy');
        if(product.userId.toString() !== req.user._id.toString()){
            return res.redirect('/');
        }
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDescription;
        if(updatedImage){
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = '\\images\\' + updatedImage.filename;
        }
        return product.save()     //mongoose does not add new data if it finds change/update in old data. It simply update with new data!
        .then(result => {
            // console.log(result);
            res.redirect('/admin/products');
        });
    }).catch(err => {
        // console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);         //will be caught by special middleware; see app.js file
    });
}

exports.deleteProduct = (req, res, next) => {
    const productId = req.params.productId;
    // Products.findByIdAndRemove(productId)
    Products.findById(productId)
    .then(product => {
        if(!product){
            return next(new Error('Product not found!'));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Products.deleteOne({ _id: productId, userId: req.user._id });
    })
    .then(result => {
        return req.user.deleteCartItem(productId);
    }).then(result => {
        res.status(200).json({ message: 'Delete Success!'});
        // res.redirect('/admin/products');
    })
    .catch(err => {
        res.status(500).json({ message: 'Product Deletion Failed!'});
        // next(err);
        // const error = new Error(err);
        // error.httpStatusCode = 500;
        // next(error);
    });
};