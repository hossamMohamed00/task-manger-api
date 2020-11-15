/* Local Modules */
const User = require('../models/user');
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account');
/* NPM Modules */
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

/* Requiring Middleware */
const auth = require('../middleware/auth');



// Initialize router
const router = new express.Router();

/* User Creation (Signup) */ 
router.post('/users', async (req, res, next ) => {
   const user = new User(req.body);
   try {
      await user.save();
      // Send welcome email
      sendWelcomeEmail(user.email, user.name);
      // Generate new token for this user
      const token  = await user.generateAuthToken();
      res.status(201).send({user, token});
      
   } catch (error) {
      res.status('400').send(error);
   }
});

/* User Login */
router.post('/users/login', async (req, res, next) => {
   try {
      const user = await User.findByCredentials(req.body.email, req.body.password);
      const token = await user.generateAuthToken();

      res.send({ user, token});
   } catch (error){
       res.status(404).send()
   }
});

/* User logout */
router.post('/users/logout', auth,  async (req, res, next) => {
   try {
      /**
       * The process of logout user => remove his current token from the tokens array 
       */
      req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);

      await req.user.save();

      res.send({ Statue: 'Logout successfully'});
   } catch (error) { 
      res.status(500).send();
   }
})

/* User logout from all sessions(phone, laptop, pc, etc..) */
router.post('/users/logoutAll', auth,async (req, res) => {
   try {
      /**
       * The process of logout user from all sessions => Just empty his/her tokens array
       */
      req.user.tokens = [];

      await req.user.save();

      res.send({ Statue: 'Logout successfully'});

   } catch (error) {
      res.status(500).send();
   }
}) 

/* Reading user own profile */
router.get('/users/me', auth, async (req, res) => {
   res.send(req.user); // The user is provided by the auth middleware
})

/* Upload User Profile */
const upload = multer({
   limits: {
      fileSize: 1000000, // 1 Mb
   },
   fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
         cb(new Error('The uploaded file must be an image (ends with .jpg | .jpeg | .png)'))
      }

      cb(undefined, true)
   } 
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
   // Edit the avatar first
   const buffer = await sharp(req.file.buffer).png().resize({width: 300, height: 290}).toBuffer();
   const userAvatar = buffer;
   req.user.avatar = userAvatar;

   await req.user.save()
   res.send()

}, (error, req, res, next) => {
   res.status(400).send({ error: error.message });
})

/* Delete user avatar */
router.delete('/user/me/avatar', auth,async (req, res) => {
   // Empty the user avatar
   req.user.avatar = undefined
   await req.user.save();

   res.send()
})

/* Fetch (Serve) user avatar */
// open from the browser 
router.get('/users/:id/avatar', async (req, res, next) => {
   try {
      const user = await User.findById(req.params.id);
      
      if (!user || !user.avatar) {
         throw new Error()
      }

      res.set('Content-Type', 'image/png')
      res.send(user.avatar)
   } catch (error) {
      res.status(404).send({ error })
   }
})

/* Updating user */ 
 router.patch('/users/me', auth, async  (req, res) => {
   // Fetch the data to update the user
   const updatedData = req.body

   // Handel if the user tried to update a field that is not allowed to update
   const allowedUpdates = ['name', 'email', 'password', 'age'];
   const updatesKeys = Object.keys(req.body);
   const isValidOperation = updatesKeys.every((updateKey) => allowedUpdates.includes(updateKey) );

   if (!isValidOperation) {
      return res.status(400).send({ error:  'Invalid updates!' });
   }

   try {
      const user = req.user;
      // Using bracket notation => because the field it should update is dynamic.
      updatesKeys.forEach((update) => user[update] = updatedData[update]);
      // save the user 
      await user.save();

       res.send({ statue: "Updated successfully", user});

    } catch (error) {
      //  console.log(error);
       res.status(400).send(error);
    }
})

/* Delete user */
router.delete('/users/me', auth ,async (req, res) => {
   try {
      await req.user.remove();
      // Send Email
      sendCancelationEmail(req.user.email, req.user.name)
      res.send({ statue: "Deleted Successfully!" });

   } catch (error) {
      res.status(500).send({ error });
   }
})

/* ---------------------------- */ 
module.exports = router;
