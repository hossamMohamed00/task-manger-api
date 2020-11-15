 /* Requiring NPM Packages */ 
const express = require('express');
const {json} = require('body-parser'); // destruct the json parser

/* Requiring Local Module */
require('./db/mongoose'); // Run the file to connect to the db
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task.js');

/* ---------------------------*/

const app = express();
const port = process.env.PORT;

/********************************************/

// Setup express to automatically parse the body data
// app.use(express.json()) // Can use this -- but this might be removed on the future
app.use(json());

app.use(userRouter); // Register all user routes
app.use(taskRouter); // Register all task routes

// Start the server
app.listen(port, () => {
   console.log('Server is up on port ' , port);
});