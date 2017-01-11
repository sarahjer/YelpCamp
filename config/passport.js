var JwtStrategy = require('passport-jwt').Strategy;  
var ExtractJwt = require('passport-jwt').ExtractJwt;  
var User = require('../app/models/user');  
var config = require('../config/main');

// Setup work and export for the JWT passport strategy
module.exports = function(passport) {  
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  opts.secretOrKey = config.secret;
  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    console.log('JWT Payload **** ---> ')
    console.log(jwt_payload);
    User.findById(jwt_payload._id, function(err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        console.log("FROM PASSPORT");
        console.log(user.username);
        done(null, user);
      } else {
        done(null, false);
      }
    });
  }));
};