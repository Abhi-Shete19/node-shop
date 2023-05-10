const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const nodemailer = require("nodemailer");
// const Transport = require("nodemailer-sendinblue-transport");
const User = require('../models/user');

let reciever,subject,html;

// const transporter = nodemailer.createTransport(new Transport({
//   auth: {
//     api_key: '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'
//   }
// }))

async function main() {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'era.weissnat@ethereal.email',
        pass: 'ZeeCFdwzMKDcGkxzTT'
    }
});

const info = transporter.sendMail({
  to: reciever,
  from: 'shop@node-complete.com',
  subject: subject,
  html: html
});

console.log("Message sent: %s", info.messageId);

console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

}

exports.getLogin = (req, res, next) => {
  let message = req.flash('error')
  if(message.length > 0 ){
    message = message[0];
  } else{
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput:{
      email: '',
      password: ''
    },
    validationError: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error')
  if(message.length > 0 ){
    message = message[0];
  } else{
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationError: []
  });
};

exports.postLogin = (req, res, next)=>{
  const userEmail = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: userEmail,
        password: password
      },
      validationError: errors.array()
    });
  }
  User.findOne({ 'email': userEmail })
  .then(user =>{
    bcrypt.compare(password, user.password)
      .then(doMatch =>{
        if(doMatch){
          req.session.user = user;
          req.session.loggedIn = true;
          return req.session.save(err=>{
            console.log(err);
            res.redirect('/');  
          });  
        }
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid Email or Password',
          oldInput: {
            email: userEmail,
            password: password
          },
          validationError: []
        });
      })
    
  })
  console.log(req.session.user) 
}

exports.postLogout =(req, res, next) =>{
  req.session.destroy((err)=>{
    console.log(err);
    res.redirect('/');
  });
}

exports.postSignup = (req, res, next) =>{
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  console.log(errors.array())
  if(!errors.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword
      },
      validationError: errors.array()
    });
  }

  bcrypt.hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: {
          items: []
        }
      });
      return user.save();
    })
    .then(()=> {
      reciever = email;
      subject = 'Signup succeeded!'
      html = '<h1>You are Successfully signed up</h1>'
      res.redirect('/login');
      return main();
    }) 
    .catch(err =>{
      console.log(err);
    })
}


exports.getReset = (req, res, next) => {
  let message = req.flash('error')
  if(message.length > 0 ){
    message = message[0];
  } else{
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) =>{
  crypto.randomBytes(32,(err, buffer)=>{
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email})
      .then(user=>{
        if(!user){
          req.flash('error','No account with that email found');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result =>{
        reciever = req.body.email;
        subject = 'Password Reset';
        html = `<p>You requested a password reset</p>
              <p>Click this <a href="http://192.168.1.61:3000/reset/${token}"> Link</a> to set new password</p>`;
        res.redirect('/')
        return main();
      })
      .catch(err=> console.log(err))
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration:{ $gt: Date.now() } })
    .then(user =>{
      let message = req.flash('error')
      if(message.length > 0 ){
        message = message[0];
      } else{
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => console.log(err))
  
};

exports.postNewPassword=(req, res, next)=>{
  const userId = req.body.userId;
  const newPassword = req.body.password;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user =>{
      resetUser = user;
      return bcrypt.hash(newPassword,12);
    })
    .then(hashedPassword =>{
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(()=>{
      res.redirect('/login');
    })
    .catch(err => console.log(err));
}