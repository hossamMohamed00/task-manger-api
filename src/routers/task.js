 /* Here will be all task routes */ 

const Task = require('../models/task');
const User = require('../models/user');

/* Requiring Middleware */
const auth = require('../middleware/auth');

const express = require('express');

const router = new express.Router();

// Setup Resource creation 

/* Task Creation */
router.post('/tasks', auth, async (req, res, next) => {
   // const task = new Task (req.body);
   const task = new Task({
      ...req.body, // The spread operator => copy all of the properties from the body over this object
       owner: req.user._id
   });

   try {
      await task.save();
      res.status(201).send(task)
   } catch (error) {
      res.status(400).send(error)
   }
})

/* Reading One Task */
router.get('/tasks/:taskId', auth, async (req, res) => {
   const _id = req.params.taskId;

   try {
      const task = await Task.findOne({ _id, owner: req.user._id });

      if (!task) {
         return res.status(404).send({error: 'Task not found !'});
      }

      res.send(task);
   } catch (error) {
      res.status(404).send(error);
   }
})

/* Reading Multiple Tasks */ 
router.get('/tasks', auth, async (req, res) => {
   const match = {}
   const sort = {}

   if (req.query.completed) {
      match.completed = req.query.completed === 'true'
   }

   if (req.query.sortBy) {
      const parts  =req.query.sortBy.split('_');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
      // 1 ==> Ascending , -1 ==> Descending 
   }

   try {
      // {Old approach} const tasks = await Task.find({owner: req.user._id}); 
      await req.user.populate({ 
         path: 'tasks',
         match,
         options: {
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
            sort
         }
      }).execPopulate(); // Allows us to populate data from a relationship (such as the data for owner) and save it in user.tasks

      if (!req.user.tasks) {
         return res.status(404).send({ status: 'No Tasks exist!' })
      }
      res.send(req.user.tasks);
   } catch (error) {
      res.status(500).send({error}) 
   }
});

/* Updating Task */
router.patch('/tasks/:id', auth, async (req, res) => {
   const taskId = req.params.id;
   const newData = req.body;

   // Handel if the user tried to update a field that is not allowed to update
   const updatesKeys = Object.keys(newData);
   const allowedUpdates = ['description', 'completed'];
   const isValidOperation = updatesKeys.every((updateKey) => allowedUpdates.includes(updateKey));
    
   if (! isValidOperation) {
      return res.status(400).send({ error: 'Invalid Updates Inputs!' });
   }
   
   try {
      const task = await Task.findOne({_id: taskId, owner: req.user._id});
      if (!task) {
         return res.status(404).send({ error: 'Task not found!'  });
      }

      updatesKeys.forEach((update) => task[update] = newData[update]);
      await task.save();

      res.send(task);
   } catch (error) {
      res.status(400).send({error});
   }
})

/* Delete task */
router.delete('/tasks/:id', auth, async (req, res) => {
   const taskID = req.params.id;

   try {
      const task = await Task.findOneAndDelete({_id: taskID, owner: req.user._id});

      if (!task) {
         return res.status(404).send({ error:  "Task not found!!"});
      }

      res.send({ statue: 'Deleted Successfully', task });
   } catch (error) {
      res.status(500).send({ error})
   }
})

// Additional endpoints

/* Delete all tasks */
router.delete('/tasks', auth, async (req, res) => {
   try {
      const result = await Task.deleteMany({owner: req.user._id});
      
      if (result.deletedCount === 0 ) {
         return res.status(404).send({error: "No Tasks To Delete!"});
      }

      res.send( { status: "Tasks deleted successfully!"});
   } catch (error) {
      res.status(500).send({ error });
   }
})

/* ---------------------------- */ 
module.exports = router;