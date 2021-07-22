const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Product', productSchema);



// const mongodb = require('mongodb');
// const getDb = require('../utility/database').getDb;

// class Product {
//   constructor(title, price, description, imageUrl, id, userId) {
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imageUrl = imageUrl;
//     this._id = id ? new mongodb.ObjectId(id) : null;
//     this.userId = new mongodb.ObjectId(userId);
//   }

//   save() {
//     const db = getDb();
//     if(this._id){
//       return db.collection('products').updateOne({ _id: this._id}, {$set: this});
//     } else {
//       return db.collection('products').insertOne(this);
//     }
//   }

//   static fetchAll() {
//     const db = getDb();
//     return db.collection('products').find().toArray()
//     .then(products => {
//       // console.log(products);
//       return products;
//     }).catch(err => {
//       console.log(err);
//     }); 
//   }

//   static getProductDetail(productId) {
//     const db = getDb();
//     return (async () => {
//       try {
//         const collection = await db.collection('products');
//         const cursor = await collection.find({ _id: new mongodb.ObjectId(productId) });
//         return await cursor.next();
//         // console.log(await cursor.next()); // null
//         //cursor.next().then(result => { console.log(result) });
//       } catch (err) {
//         console.log(err);
//       }
//     })();
//     // return db.collection('products').find({ _id: new mongodb.ObjectId(productId) }).next()
//     // .then(product => {
//     //   console.log(product);
//     //   return product;
//     // }).catch(err => {
//     //   console.log(err);
//     // })
//   }

//   static deleteProduct(productId) {
//     const db = getDb();
//     return db.collection('products').deleteOne({ _id: new mongodb.ObjectId(productId)});
//   }
// }

// module.exports = Product;