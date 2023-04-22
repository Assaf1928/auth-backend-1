const mongoose = require("mongoose");
const uuid = require('node-uuid');
const Schema = mongoose.Schema;

const SampleScheme = new mongoose.Schema({
    qr: {
        type: String
      },
      time: {
        type: Date
      },
      location: {
        type: Schema.Types.ObjectId, ref: 'Locations',
        required: [true],
        unique: false,      
      },
      note: {
        type: String
      },
      user: {
        type: Schema.Types.ObjectId, ref: 'Users',
        required: [true]
      },
      tubes: [
       { type: Schema.Types.ObjectId, ref: 'Tubes'}
    ]
  })

  module.exports = mongoose.model.Samples || mongoose.model("Samples", SampleScheme);

  