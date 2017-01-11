var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var morgan = require('morgan');  
var passport = require('passport');  
var jwt = require('jsonwebtoken');
var config = require('./config/main');
var User = require('./app/models/user');
var path = require('path');
var Campground = require("./app/models/campground");
var Comment = require("./app/models/comment");

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('somethingtopsecrethere', config.secret);
// Initialize passport for use
app.use(passport.initialize()); 
app.use(methodOverride("_method"));
app.use(morgan('dev'));

app.set('view engine', 'html');
app.set('views',  '/views/campground');



// Mongoose connect
mongoose.Promise = global.Promise; 
mongoose.connect(config.database);

// Bring in defined Passport Strategy
require('./config/passport')(passport);  

// Create API group routes
var apiRoutes = express.Router();

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    // res.locals.error = req.flash("error");
    // res.locals.success = req.flash("success");
    next();
});


// Root Route
app.get('/', function(req, res) {  
  res.sendFile(path.join(__dirname +'/views/campground/landing.html'));
});

apiRoutes.get('/campgrounds',passport.authenticate('jwt', { session: false }), function(req, res){
     Campground.find({}, function(err, allcampgrounds){
        if(err){
            console.log(err);
        } else {
            res.send(JSON.stringify({campgrounds: allcampgrounds}));
        }
    });
    
});


app.get('/campgrounds', function(req, res){
    res.sendFile(path.join(__dirname +'/views/campground/campgrounds.html'));
});

app.post("/campgrounds/new", passport.authenticate('jwt', { session: false }), function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        'id': req.user._id,
        'username': req.user.username
    };
    
    var newCampground = {name: name, image: image, description: desc, author: author};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err) {
          return res.json({ success: false, message: 'Cannot create campground.', });
        } else {
            // redirect to campgrounds page
            console.log(newlyCreated);
            res.json({ success: true, message: 'Successfully created new campground.' });
        }
    });
});

// NEW - show form to create new campground
app.get('/campgrounds/new', function(req, res){
  res.sendFile(path.join(__dirname +'/views/campground/new.html'));
});
   

// apiRoutes.get('/campgrounds/:id', function(req, res){
//     //  find the campground with provided id
//      Campground.findById(req.params.id, function(err, foundCampground){
//         if(err){
//             console.log(err);
//         } else {
//             res.send(JSON.stringify({campgrounds: foundCampground}));
//         }
//         return apiRoutes;
//     });
// });


apiRoutes.get('/campgrounds/:id', function(req, res){
    //  find the campground with provided id
    Campground.findById(req.params.id)
        .populate('comments')
        .exec(function (err, campgrounds){
            if(err){
                console.log(err);
            } else {
                res.send(JSON.stringify({campgrounds: campgrounds}));
            }
        }); 
}); 
        

//  SHOW - shows more info about one campground
app.get("/show", function(req, res){
    res.sendFile(path.join(__dirname +'/views/campground/show.html'));
});

// API EDIT CAMPGROUND ROUTE
apiRoutes.get("/campgrounds/:id/edit", function(req, res){
     Campground.findById(req.params.id, function(err, foundCampground){
       if(err){
          console.log(err);
      } else {
          res.send(JSON.stringify({campgrounds: foundCampground}));
      }
      return apiRoutes;
});
});

// EDIT CAMPGROUND ROUTE
app.get("/edit", function(req, res){
    res.sendFile(path.join(__dirname +'/views/campground/edit.html'));
});

// UPDATE CAMPGROUND ROUTE
app.put("/edit/:id", function(req, res){
//   find and update the correct campground
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var updatedCampground = {name: name, image: image, description: desc};
    Campground.findByIdAndUpdate(req.params.id, updatedCampground, function(err, updatedCampground){
        if(err){
            return res.json({ success: false, message: 'Cannot update campground.', });
        } else {
            // redirect somewhere
            return res.json({ success: true, message: 'Campground Updated Successfully.', });
        }
    });
});

// DESTROY CAMPGROUND ROUTE
app.delete("/campgrounds/:id",  function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
          return  res.json({success: false, message: "Cannot Delete Campground"});
        } else {
            res.json({success: true, message: "Successfully Deleted Campground"});
        }
    });
});

// Comment Routes
apiRoutes.get("/campgrounds/:id/comments/new", function(req, res){
    // find campground By id
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
            res.send(JSON.stringify({campground: campground}));
        }
        return apiRoutes;
    });
});



// New Comment ROUTE
app.get("/comments/new", function(req, res){
    res.sendFile(path.join(__dirname +'/views/comment/new.html'));
});

// Comments create
app.post("/comments/:id", passport.authenticate('jwt', { session: false }), function(req, res){
    var text = req.body.text;
    // lookup campground using ID
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.json({success: false, message: "Cannot find Campground"});
        } else {
            var newComment = { text: text };
            Comment.create(newComment, function(err, comment){
                if(err){
                    res.json({success: false, message: "Cannot create comment"});
                    console.log(err);
                } else {
                    // add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    console.log("*****Author Name*****");
                    console.log(req.user);
                    // save comment
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    res.json({success: true, message: "Successfully created Comment"});
                    }            
            });
            }
    });
});

// COMMENTS EDIT ROUTE
apiRoutes.get("/campgrounds/:id/comments/edit/:comment_id", function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            console.log(err);
        } else {
             res.send(JSON.stringify({comments: foundComment}));
      } 
      return apiRoutes;
});
});

// EDIT CAMPGROUND ROUTE
app.get("/comments/edit/", function(req, res){
    res.sendFile(path.join(__dirname +'/views/comment/edit.html'));
});

// COMMENT UPDATE
app.put("/campgrounds/:id/comments/:comment_id",passport.authenticate('jwt', { session: false }), function(req, res){
    var text1 = req.body.text;
    var updatedComment = { text: text1 };
   Comment.findByIdAndUpdate(req.params.comment_id, updatedComment, function(err, updatedComment){
       if(err){
           res.json({success: false, message: "Comment not Updated"});
       } else {
           res.json({success: true, message: "Updated Comment"});
       }
   });
});

// COMMENT DESTROY ROUTE
app.delete("/campgrounds/:id/comments/:comment_id",  function(req, res){
    // findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.json({success: false, message: "Cannot delete comment"});
        } else {
            res.json({success: true, message: "Comment Deleted"});
        }
    });
});

// Set url for API group routes
app.use('/api', apiRoutes);

// SignUp Page
app.get('/register', function(req, res){
  res.sendFile(path.join(__dirname +'/views/register.html'));
});

// Register new users
app.post('/register', function(req, res) {  
  if(!req.body.username || !req.body.password) {
    res.json({ success: false, message: 'Please enter username and password.' });
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });
    // Attempt to save the user
    newUser.save(function(err, user) {
      if (err) {
        return res.json({ success: false, message: 'That user already exists.'});
      }
        var token = jwt.sign(user.toObject(), config.secret, {
            // expiresIn: 10080 // in seconds
          });
          res.send({ success: true, token: 'JWT ' + token, redirect: true, redirectURL: '/campgrounds'});
      // res.json({ success: true, message: 'Successfully created new user.' });
          console.log(user);
    });
  }
});

// Login Page
app.get("/login", function(req, res) {
    res.sendFile(path.join(__dirname +'/views/login.html'));
});

// Authenticate the user and get a JSON Web Token to include in the header of future requests.
app.post('/login', function(req, res) {  
    console.log(req.body.username);
  User.findOne(
    {username: req.body.username}, 
    function(err, user) {
    if (err) 
        console.log(err);
    if (!user) {
      res.send({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          var token = jwt.sign(user.toObject(), config.secret, {
            expiresIn: 10080 // in seconds
          });
          res.send({ success: true, token: 'JWT ' + token, user: user, redirect: true, redirectURL: '/campgrounds' });
          
        } else {
          res.send({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});



// route to authenticate a user
function isLoggedIn(req, res, next){
    passport.authenticate('jwt', { session: false });
}

// Protect dashboard route with JWT
app.get('/checkUser', passport.authenticate('jwt', { session: false }), function(req, res) {  
  res.json({success: true, message: "Checked User"});
});

app.listen(process.env.PORT, process.env.IP, function(req, res){
   console.log("Server has started");
});