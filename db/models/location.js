const mongoose = require("mongoose");

const LocationScheme = new mongoose.Schema({
      name: {
        type: String,
        required: [true],
        unique: false,
      },
  })

  module.exports = mongoose.model.LocationScheme || mongoose.model("Locations", LocationScheme);

  