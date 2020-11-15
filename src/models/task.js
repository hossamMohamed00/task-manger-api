const mongoose = require('mongoose');

const schemaOptions = {
   timestamps: true
}

const taskSchema = new  mongoose.Schema({
   description: {
      type: String,
      required: true,
      trim: true
   },
   completed: {
      type: Boolean,
      default: false
   },
   owner: {
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      ref: 'User' // ref is a short for reference from this field to another model
   }
}, schemaOptions)

const Task =  mongoose.model('Task', taskSchema);

module.exports = Task;