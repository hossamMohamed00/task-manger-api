const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcryptjs'); // Hash plain text password
const jwt = require('jsonwebtoken'); // Json Web Token
const Task = require("./task");

const schemaOptions = {
    timestamps: true
}

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    age: {
        type: Number,
        default: 0,

        validate(value) {
        if (value < 0) {
            throw new Error("Negative number not allowed");
        }
        },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,

        validate(value) {
        if (!validator.isEmail(value)) {
            throw new Error("Email is invalid!");
        }
        },
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,

        validate(value) {
        if (value.toLowerCase().includes("password")) {
            throw new Error('Password cannot contain word "password" ');
        }
        },
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, schemaOptions);

/* ------------------------ */ 
// Setting up a virtual property for tasks
//      ==> It's not actual data stored in database. 
//      ==> It's a relationship between entities.  
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


/* ------------------------ */ 
// Setup  the middleware ==> to hashing password (plain text) before saving 
// we have pre method ==> to do something before (saving, validate, ...) 
// we have post method ==> to do something after (saving, validate, ...)
/*
    It is passed in standard func not an arrow func,
    Because "this" binding plays an important role,
    And as we know arrow func didn't binding this.
 */

/**
 * Hash the plain text password before saving
 */
userSchema.pre('save', async function (next) {
     // this => gives us access to individual user 
    const user = this;

    // Check first, if the password changed (became a plain text) or it's already hashed 
    if (user.isModified('password')) {
        // The second argument is the number of rounds we wanna perform=> how many times the hashing algorithm is executed 
        // 8 => is the value which recommended by the original creator of the bcrypt algorithm
        user.password = await bcrypt.hash(user.password, 8);
    }

    next(); // To continue and not hanging on this function
    
    // Encryption ==> we can get the original value back
    // Hashing     ==> Are one way algorithm ==> we can't reverse the proc ess 
})

/**
 * Delete user tasks when user is removed
 */
userSchema.pre('remove', async function (next){
    const user = this;
    await Task.deleteMany({ owner: this._id });
    next();
})


/* ------------------------ */ 

// Create a new method on the User Model (Model method)

/**
 * Check if the user exist or not 
 */
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});

    if (!user) {
        throw new Error('Unable to find this email!');
    }
    // Check if the password matches or not 
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('The username or password is incorrect!');
    }

    return user;
}

/* ------------------------ */ 

// Create a new method on the user instance  (Instance method)

/**
 * Setup function to return some user data, which will be send to the client.
 * toJSON it is automatically called by express when he stringify the object. 
 */
userSchema.methods.toJSON = function () {
    const user = this;
    // toObject() provided by mongoose =>
    // ... Used to get back row (will remove all method attached like save operation) object with user data 
    const userObject = user.toObject()

    // Delete the unwanted data using the delete operator
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

/**
 * Generate JWT fot every specific user
 */
userSchema.methods.generateAuthToken = async function () {
    const user = this;

    // Generate new token
    /**
        * the first parameter is object contains the data to be embedded in the token. (unique)
        *  the second parameter is a string secret => will use to sign the token 
    */
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    // Add the token to the user tokens array
    user.tokens = user.tokens.concat({ token }); 
    // === user.tokens.push({ token });
    
    await user.save();

    return token;
}

/* ------------------------ */ 

const User = mongoose.model("User", userSchema);

// Export the User model
module.exports = User;