const jwt = require('jsonwebtoken');
const User = require('../models/user');


const auth = async (req, res, next) => {
  try {
     const token = req.header('Authorization').replace('Bearer ', '') // Get the token from the header (client sent it)
      const decoded = jwt.verify(token, process.env.JWT_SECRET) // if matched, return the data (payload)
      const userId = decoded._id;

      const user = await User.findOne({ _id: userId, 'tokens.token': token });
      if (!user) {
         throw new Error();
      }

      // Send the user and token to the route handler (To save resources and time)
      req.user = user;
      req.token = token;
      next();
   } catch (error) {
     res.status(401).send({ error: "Please authenticate." })
  }
}

module.exports = auth;