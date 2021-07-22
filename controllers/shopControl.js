const crypto = require('crypto');   //in-built express module/library to create secure, unique and random values(token). (we used in reset password.)
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
const stripe = require('stripe')('sk_test_51IEs0dKYVz1Z7jlye9jOGJJLUDmJCUcfBcvVRI5mCKsz2SpFvaIglKJJX6ZKnOiib4GNORTWLd1jRodVSTqpx1Rt008lfhv6cL');

const rootDir = require('../utility/path');

const Products = require('../models/product');
const Order = require('../models/order');
const transport = require('../middleware/mailer-sendgrid'); //email-service
const { Mongoose } = require('mongoose');

const ITEMS_PER_PAGE = 2;

exports.renderHome = (req, res, next) => {
    Products.find()
    .then(products => {
        res.render("shop/index", {
          products,
          pageTitle: "My Shop 🏪",
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Products.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Products.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", { 
          products, 
          pageTitle: "Products",
          currentPage: page,
          hasNextPage: page * ITEMS_PER_PAGE < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
         });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.renderProductDetail = (req, res, next) => {
    const prodId = req.params.productId;    //req.params is an Object with parameters.  url.com/products/variable(:productId)
    Products.findById(prodId)
    .then(product => {
        res.render('shop/product-detail', {product, pageTitle: ''});
    }).catch(err => {
        // console.log(err);
        console.log('Error in renderProductDetail...');
        next(); //maybe product not found, hence added next(), so that 404 catch this now.
    });
};

exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    Products.findById(productId)
    .then(product => {
        return req.user.addToCart(product);
    }).then(result => {
        res.redirect('/products');
    }).catch(err => {
        console.log(err);
    });
};

exports.renderCart = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        return user.cart.items.map(item => {
            const product = item.productId._doc;
            product.qty = item.qty;
            return product;
        });
    }).then(products => {
        res.render('shop/cart', { products, pageTitle: 'Cart'});
    }).catch(err => {
        next(err);
    });
};

exports.deleteItemFromCart = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.deleteCartItem(prodId)
    .then(result => {
        res.redirect('/cart');
    }).catch(err => {
        console.log(err);
    });
};

exports.getCheckout = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            req.flash('error', 'Something went Wrong. Please try again!');
            return res.redirect('/cart');
        }
        const token = buffer.toString('hex');
        let totalAmount = 0;
        let productsArray;
        req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            if(user.cart.items.length <= 0){
                console.log('Winner');
                return next(new Error('Unauthorized Access!'));
            }
            user.cart.checkoutToken = token;
            return user.save()
            .then(result => {
                return user.cart.items.map(item => {
                    const product = item.productId._doc;
                    product.qty = item.qty;
                    totalAmount += product.price * product.qty;
                    return product;
                });
            });
        }).then(products => {
            productsArray = products;
            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(product => {
                    return {
                        name: product.title,
                        description: product.description,
                        amount: product.price * 100,    //in cent
                        currency: 'USD',
                        quantity: product.qty
                    };
                }),
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success/' + token,  //http://localhost:3000/checkout/success
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
            });
        }).then(session => {
            return res.render("shop/checkout", {
            products: productsArray,
            totalAmount: totalAmount.toFixed(2),
            sessionId: session.id,
            pageTitle: "Checkout Page",
            });
        }).catch(err => {
            next(err);
        });
    });
};

exports.postOrder = (req, res, next) => {
    const checkoutToken = req.params.checkoutToken;
    let userEmail;
    let emailProductHTML = "";
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        if(user.cart.checkoutToken !== checkoutToken){
            return next(new Error('Unauthorized Payment Access!'));
        }
        userEmail = user.email;
        user.cart.checkoutToken = undefined;
        return user.save()
        .then(result => {
            return user.cart.items.map(item => {
                const product = item.productId._doc;    //_doc used to assign the complete data. Without _doc, only productId will be assigned, not the complete populated data.
                product.qty = item.qty;
                return product;
            });
        });
    }).then(productsArray => {
        const order = new Order({ items: productsArray, user: req.user });  //'ProductsArray' can be simply replaced with 'req.user.cart.items', where we will store the productId on the products only. But that may cause change in the orders if product data change or deleted.
        return order.save().then(result => {
            return productsArray;
        });
    })
    .then(productsArray => {
        productsArray.forEach(product => {
            emailProductHTML += `<h2>${product.title}</h2>`;
            emailProductHTML += `<p><b>Price:</b> ${product.price}</p>`;
            emailProductHTML += `<p><b>Quantity:</b> ${product.qty}</p>`;
            emailProductHTML += `<p><b>Product Info:</b> ${product.description}</p>`;
            emailProductHTML += `<hr>`;
        });
        req.user.cart.items = [];
        req.user.save();
        res.redirect('/orders');
        return transport.sendMail({
            to: userEmail,
            from: 'mitanshukr01@gmail.com',
            subject: 'Your Order is Placed!',
            html: `<h1>Thank you for Shopping!</h1>
                    <u>Your recent purchase are:</u>
                    ${emailProductHTML}`,
        }).catch(err => {
            console.log(err);
        });
    }).catch(err => {
        console.log(err);
    })
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user._id': req.user._id })
    .then(orders => {
        res.render('shop/orders', {orders, pageTitle: 'Your Orders'});
    }).catch(err => {
        console.log(err);
    })
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No Order Found!"));
      }
      if (order.user._id.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized Access!"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join(rootDir, "data", "invoices", invoiceName);

      res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition",'inline; filename="' + invoiceName + '"');

      const invoice = new PDFDocument();
      invoice.pipe(fs.createWriteStream(invoicePath));
      invoice.pipe(res);

      invoice.fontSize(26).text('Invoice');
      invoice.text('----------------');
      let totalPrice = 0;
      order.items.forEach(item => {
          const itemPrice = item.price * item.qty;
          totalPrice += itemPrice;
          invoice.fontSize(12).text(`${item.title} || Price: $${item.price} | Quantity: ${item.qty} | Amount: $${itemPrice}`);
      });
      invoice.text('---------');
      invoice.text(`Total Amount: $${totalPrice}`);
      invoice.text('Thank you for Shopping!');
      invoice.end();

      //   fs.readFile(invoicePath, (err, data) => {
      //     if (err) {
      //       return next(err);
      //     }
      //     res.setHeader("Content-Type", "application/pdf");
      //     res.setHeader("Content-Disposition",'inline; filename="' + invoiceName + '"');
      //    //attachment; to get file downloaded or inline; to open the file in browser.
      //     res.send(data);
      //     res.end();
      //   });

      //another method:
    //   const file = fs.createReadStream(invoicePath);
    //   res.setHeader("Content-Type", "application/pdf");
    //   res.setHeader(
    //     "Content-Disposition",
    //     'inline; filename="' + invoiceName + '"'
    //   );
    //   file.pipe(res);
    })
    .catch((err) => {
      next(err);
    });
};
