const mongoose = require('mongoose');
 
const targetConn = mongoose.createConnection('mongodb://localhost:27017/Target', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
 
const attemptConn = mongoose.createConnection('mongodb://localhost:27017/Attempt', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
 
const userConn = mongoose.createConnection('mongodb://localhost:27017/User', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
 
module.exports = {
  targetConn,
  attemptConn,
  userConn,
};