const mongoose = require('mongoose');
const Schema =mongoose.Schema;

const productSchema = new Schema({
  title:{
    type: String,
    required: true
  },
  price:{
    type: Number,
    required:true
  },
  imageUrl:{
    type: String,
    required: true
  },
  description:{
    type: String,
    required: true
  },
  userId :{
    type: Schema.Types.ObjectId, ref: 'User' ,
    required: true
  }
})


module.exports = mongoose.model('Product',productSchema);
// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// class Product{
//   constructor(title,price,imageUrl,descreption,id,userId){
//     this.title = title;
//     this.price = price;
//     this.descreption = descreption;
//     this.imageUrl = imageUrl;
//     this._id = id ? new mongodb.ObjectId(id) : null;
//     this.userId = userId;
//   }

//   save(){
//     const db = getDb();
//     let dbOps;
//     if(this._id){
//       dbOps = db.collection('products')
//       .updateOne({ _id: this._id },{ $set: this })
//     } else{
//       dbOps = db.collection('products').insertOne(this)
//     }

//     return dbOps
//       .then(result=>{
//         console.log(result);
//       })
//       .catch(err => console.log(err));
//   }

//   static fetchAll(){
//     const db = getDb();
//     return db.collection('products')
//       .find()
//       .toArray()
//       .then(products =>{
//         console.log(products);
//         return products;
//       })
//       .catch(err => console.log(err));
//   }

//   static findById(prodId){
//     const db = getDb();
//     return db.collection('products')
//       .find({ _id: new mongodb.ObjectId(prodId)})
//       .next()
//       .then(product =>{
//         console.log(product);
//         return product;
//       })
//       .catch(err => console.log(err));
//   }

//   static deleteProduct(prodId){
//     const db = getDb();
//     return db.collection('products')
//       .deleteOne({ _id: new mongodb.ObjectId(prodId) })
//       .then(result=>{
//         console.log(result);
//       })
//       .catch(err => console.log(err));
//   }
// }

// module.exports = Product;