const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const TubeScheme = new mongoose.Schema({
    
      type: {
        type: Schema.Types.ObjectId, ref: 'TubeTypes',
        required: [true],
        unique: false,
      },
      value: {
        type: Number,
        required : [false],
        uqniue: false
      },
      sampleId: {
        type: Schema.Types.ObjectId, ref: 'Samples',
        required: [true],
        unique: false,
      },
  })

  module.exports = mongoose.model.Tubes || mongoose.model("Tubes", TubeScheme);

  