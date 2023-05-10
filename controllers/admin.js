const Product = require('../models/product');
const { validationResult } = require('express-validator')
const fileHelper = require('../util/file')
exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError:false,
    errorMessage: null,
    validationError: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image)
  if(!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError:true,
      product:{
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not image',
      validationError: []
    });
  }
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError:true,
      product:{
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationError: errors.array()
    });
  }

  const imageUrl = image.path;
  console.log(imageUrl)

  const product = new Product({
    title: title,
    price: price,
    imageUrl: imageUrl,
    description: description,
    userId: req.user
  });
  product
      .save()
      .then((result)=>{
      console.log(result)
      res.redirect('/');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
   
};

exports.getEditProduct = (req, res, next) => {
  const editMode =req.query.edit;
  if(!editMode){
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
      .then(products =>{
        const product = products;
        if(!product){
          return res.redirect('/');
        }
        res.render('admin/edit-product', {
          pageTitle: 'Edit Product',
          path: '/admin/edit-product',
          editing: editMode,
          hasError: false,
          product: product,
          errorMessage: null,
          validationError: []
        });
      });
};

exports.postEditProduct = (req,res,next)=>{
  const prodId = req.body.productId;
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editing: true,
      hasError:true,
      product:{
        title: title,
        price: price,
        description: description,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationError: errors.array()
    });
  }
  Product.findById(prodId)
    .then(product =>{
      if(product.userId.toString() !== req.user._id.toString()){
        return res.redirect('/');
      }
      product.title = title;
      product.price = price;
      if(image){
        fileHelper.deleteFile(product.imageUrl)
        product.imageUrl = image.path;
      }
      product.description = description;
      return product.save()
      .then(result =>{
        console.log('Updated Product')
        res.redirect('/admin/products');
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }); 
  // Product.findById(prodId)
  //   .then(product =>{
  //     product.title = title;
  //     product.price = price;
  //     product.imageUrl = imageUrl;
  //     product.descreption = descreption;
  //     return product.save();
    // })
     
};

exports.deleteProduct = (req, res, next)=>{
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product =>{
      if(!product){
        return next(new Error('Product not found.'))
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.user._id })
    })
    .then(result =>{
      console.log('destroyed Product')
      res.status(200).json({message:'Success!'});
    })
    .catch(err => {
      res.status(500).json({message:'Deleting product failed'})
    });

}

exports.getProducts = (req, res, next) => {
  Product.find({ userId : req.user._id })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
  }).catch(err =>{
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};