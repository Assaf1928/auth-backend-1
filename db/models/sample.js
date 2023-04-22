const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
    id: {
        type: String,
      },
    
      spotId: {
        type: Number,
      },
      temperature: {
        type: Number
      },
      time: {
        type: Date
      },
      location: {
        type: Location
      },
      tubes: {
        type: Array
      }

  })

  module.exports = mongoose.model.Users || mongoose.model("Users", UserSchema);

  