const express = require("express");

// const cookieParser = require('cookie-parser')
// const { MongoClient } = require('mongodb');
const passport = require('passport');
const session = require('express-session')
// const bCrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');

var baseDeDatosConectada = false;
const URL_BASE_DE_DATOS = '';
mongoose.set('strictQuery', false)

function conectarDB(url) {
    return mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
}

const User = mongoose.model('Users', {
    username: String,
    password: String,
    email: String,
    firstName: String,
    lastName: String
});

passport.use('login', new LocalStrategy({
    passReqToCallback: true
  },
  function (req, username, password, done) {
    // check in mongo if a user with username exists or not
    User.findOne({ 'username': username })
      .then(user => {
        // Username does not exist, log error & redirect back
        if (!user) {
          console.log('User Not Found with username ' + username);
          return done(null, false, console.log('message', 'User Not found.'));
        }

        // User exists but wrong password, log the error 
        if (user.password !== password) {
          console.log('Invalid Password');
          return done(null, false, console.log('message', 'Invalid Password'));
        }

        // User and password both match, return user from 
        // done method which will be treated like success
        return done(null, user);
      })
      .catch(err => {
        // In case of any error, return using the done method
        console.error('Error in findOne:', err);
        return done(err);
      });
  })
);


passport.use('signup', new LocalStrategy({
    passReqToCallback: true
  },
  function (req, username, password, done) {
    findOrCreateUser = function () {
      // find a user in Mongo with provided username
      User.findOne({ 'username': req.body.username })
        .then(user => {
          // already exists
          if (user) {
            console.log('User already exists');
            return done(null, false, console.log('message', 'User Already Exists'));
          } else {
            // if there is no user with that username
            // create the user
            var newUser = new User();
            // set the user's local credentials
            
            console.log("--- Registros que se guardan  ---")
            newUser.username = req.body.username;
            console.log(req.body.username)
            newUser.password = req.body.password;
            console.log(req.body.password)
            newUser.email = req.body.email;
            console.log(req.body.email)
            newUser.firstName = req.body.firstName;
            console.log(req.body.firstName)
            newUser.lastName = req.body.lastName;
            console.log(req.body.lastName)
            console.log("--- Registros que se guardan  ---")

            // save the user
            return newUser.save()
              .then(savedUser => {
                console.log('User Registration successful');
                return done(null, savedUser);
              })
              .catch(saveError => {
                console.log('Error in Saving user:', saveError);
                return done(saveError);
              });
          }
        })
        .catch(err => {
          // In case of any error, return using the done method
          console.log('Error in findOne:', err);
          return done(err);
        });
    };

    // Delay the execution of findOrCreateUser and execute 
    // the method in the next tick of the event loop
    process.nextTick(findOrCreateUser);
  })
);

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id).exec()
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err, null);
      });
});
  



const app = express()
// app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// usamos -> session = require('express-session')
app.use(session({
    secret: 'keyboard cat',
    // httpOnly: false,
    // rolling: true,
    // maxAge: config.TIEMPO_EXPIRACION
    cookie: {
        // maxAge: 1000 * 60 * 60 * 24 // 1 dia
    },
    resave: true,
    secure: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
    res.send("<h1>¡Bienvenido a la página de inicio!</h1>");
});
app.post('/login',  passport.authenticate('login', { failureRedirect: '/error' ,successRedirect: '/bien'}), (req, res, next) => {
    console.log("--- login ---")
    console.log(req.user.username)
    console.log(req.user.password)
    console.log("--- login ---")
});
// app.post("/login", (req, res, next) => {
    
    //     console.log("--- Login ---")
    //     console.log(req.user.username)
    //     console.log(req.user.password)
    //     console.log("--- Login ---")
    // })
    
app.post('/register',  passport.authenticate('signup', { failureRedirect: '/error' ,successRedirect: '/bien'}), (req, res, next) => {
    console.log("--- register ---")
    console.log(req.user.username)
    console.log(req.user.password)
    console.log("--- register ---")
});
// app.post("/register", (req, res, next) => {

//     console.log("--- Register ---")
//     console.log(req.body.username)
//     console.log(req.body.password)
//     console.log("--- Register ---")

//     res.redirect("/")

// })

app.get("/login", (req, res, next) => {
    
    const form = '<h1>Login Page</h1><form method="POST" action="/login">\
    Enter Username:<br><input type="text" name="username">\
    <br>Enter Password:<br><input type="password" name="password">\
    <br><br><input type="submit" value="Submit"></form>';
    
    res.send(form);
})
app.get("/register", (req, res, next) => {
    
    const form = '<h1>Register Page</h1><form method="post" action="register">\
    Enter Username:<br><input type="text" name="username">\
    <br>Enter Password:<br><input type="password" name="password">\
    <br><br><input type="submit" value="Submit"></form>';
    
    res.send(form);
})


function checkAuthentication(req,res,next){
    if(req.isAuthenticated()){
        //req.isAuthenticated() will return true if user is logged in
        next();
    } else{
        res.redirect("/no_check");
    }
  }
app.get("/check", checkAuthentication, (req, res, next) => {
    res.send("<h1> ¡ CHECK ! </h1>");
})
app.get("/no_check", (req, res, next) => {
    res.send("<h1> ¡ NO CHECK ! </h1>");
})

app.get("/error", (req, res, next) => {
    res.send("<h1> ERROR  </h1>");
    console.log("--- error ---")
    console.log(req.user.username)
    console.log(req.user.password)
    console.log("--- error ---")
})
app.get("/bien", (req, res, next) => {
    res.send("<h1> BIEN  </h1>");
    console.log("--- bien ---")
    console.log(req.user.username)
    console.log(req.user.password)
    console.log("--- bien ---")
})

app.get("/logout", (req, res) => {
    req.logout(() => {
        res.send("<h1> DESLOGUIADO </h1>");
    });
  })



const PORT = 3001


conectarDB(URL_BASE_DE_DATOS)
  .then(() => {
    console.log('BASE DE DATOS CONECTADA');

    app.listen(PORT, function(err) {
      if (err) return console.log('error en listen server', err);
      console.log(`Server running on PORT http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.log('error en conexión de base de datos', err));
  
