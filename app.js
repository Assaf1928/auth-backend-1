const express = require("express");
const app = express();
const bodyParser = require('body-parser');
// require database connection 
const dbConnect = require("./db/dbConnect");
const bcrypt = require("bcrypt");
const User = require('./db/models/user');
const TubeType = require('./db/models/tubeType')
const Location =  require('./db/models/location.js')
const Sample = require('./db/models/sample.js')
const Tube = require('./db/models/tube')
const jwt = require("jsonwebtoken");
const auth = require("./auth.js");
const moment = require('moment')
var ObjectId = require('mongoose')
const excelJS = require("exceljs");



// execute database connection 
dbConnect();








// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});



// body parser configuration
app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});



app.get('/tubes/excel/:id', async (req, res) => { 
  const workbook = new excelJS.Workbook();  // Create a new workbook
  const worksheet = workbook.addWorksheet("My Tubes"); // New Worksheet
  let path = './files'
  if(ObjectId.isValidObjectId(req.params.id) == false) {
    response.status(500).send()
    return
  }
  let sample = await Sample.findById(req.params.id)
  if(!sample) {
    response.status(500).send()
  }
  worksheet.columns = [
    { header: "name", key: "typeName", width: 10 },
    { header: "value", key: "value", width: 10 }, 

];

let vm = await tubesToVm(sample)
vm.forEach((tube) => {
  worksheet.addRow(tube);
});

worksheet.getRow(1).eachCell((cell) => {
  cell.font = { bold: true };
});
try {
  res.status(200);
  res.setHeader('Content-Type', 'text/xlsx');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=tubes.xlsx'
  );
  res.status(200)

   await workbook.xlsx.write(res)
   .then(() => {
     res.send()
   });
} catch (err) {
  console.log(err)
    res.send({
    status: "error",
    message: "Something went wrong",
  });
  }
});


app.delete('/locations/:id', async (req,res) => {
  try {
 await Location.findOneAndRemove({_id: req.params.id})
  res.status(201).send({
  message: "Location Deleted Sucessfully",
})
  } catch(ex) {
    throw ex
  }
})


app.get('/locations',  async (request,response) => {
  try {
  let locations = await Location.find({})
  let vm = []
  locations.forEach(t => vm.push({
    id: t._id.toString(),
    name: t.name 
  }))
  response.status(201).send({
    res: vm
  })
} catch(er) {
  throw er;
}
})
app.post('/samples/:id/tubes', async (req,res) => {
  const sample = await Sample.findById(req.params.id);
  if(!sample) {
    res.status(500).send()
    return;
  }
  await Tube.deleteMany({sampleId: sample._id})
  let toInsert = []
  req.body.tubes.forEach(async element => {
    toInsert.push(new Tube({
      type: element.typeId,
      value: element.value,
      sampleId: sample._id
    }))
  });
  await Tube.insertMany(toInsert)
res.status(200).send()

})
app.put('/samples/:id', async (req, res) => {
  const sample = await Sample.findById(req.params.id);
  if (!sample) return res.status(500).send('The sample with the given ID was not found.');
  sample.location = req.body.locationId;
  sample.note = req.body.note
  const updateSample = await Sample.updateOne({_id: req.params.id}, sample);
  res.send(sample);
});
app.get('/overview/tubes/:locationId/:typeId/:from/:to', async (request,response) => {
 let vmObject = []
  let formDate = moment(request.params.from)
  let toDate = moment(request.params.to)
  if(ObjectId.isValidObjectId(request.params.locationId) && ObjectId.isValidObjectId(request.params.typeId)) {
  const samples = await Sample.find({location: request.params.locationId});
  const tubes = await Tube.find({type: request.params.typeId})
    while(formDate.isSameOrAfter(toDate) == false) {
      let val = 0

      samples.forEach(sample => {
      if(moment(sample.time).isSame(formDate,'day')) {

       let relevantTubes = tubes.filter(x=>x.sampleId.equals(sample._id))
       if(relevantTubes) {
       relevantTubes.forEach(t => val += t.value)
       }
      }
    })
      vmObject.push({date: moment(formDate).format('YYYY-MM-DD'), value: val})
      formDate = moment(formDate).add('days',1)
    }
  response.status(200).send(vmObject)
 
  } else {
    response.status(500).send()
  }
})

tubesToVm =  async (sample) => {
  let tubeType = await TubeType.find({})
  let tube = await Tube.find({sampleId: sample._id})
  let vm = []
  tubeType.forEach((t) => {
      let randomNumber = Math.random(0,9999)
    let tubesValues = tube?.filter(tube => tube.type.toString() == t._id.toString())
    if(tubesValues.length > 0) {
    tubesValues.forEach(tubeValue => {
    vm.push({
      value: tubeValue ? tubeValue.value : 0,
      typeId: t._id.toString(),
      typeName: t.name,
      id: tubeValue._id
    })
    })
  } else {
    vm.push({
      value:  0,
      typeId: t._id.toString(),
      typeName: t.name,
      id: randomNumber
    })
  }
  })
  return vm
}

app.get('/samples/:id/tubes', async (request,response) => {
  if(ObjectId.isValidObjectId(request.params.id) == false) {
    response.status(500).send()
    return
  }
  let sample = await Sample.findById(request.params.id)
  if(!sample) {
    response.status(500).send()
  }
  if(sample.tubes && sample.tubes.length > 0) {
  } else {
   let vm = await tubesToVm(sample)

    response.status(200).send({
      vm
    })
  }

})

app.get('/samples/existance/:id', async (request, response) => {
  if(ObjectId.isValidObjectId(request.params.id) == false) {
    response.status(500).send()
    return
  }
  let sample = await Sample.findById(request.params.id)
  let users = await User.find({})
  if(!sample) {
    response.status(500)
  }
  let sampleUser = users?.find(u => u._id.equals(sample.user))
  console.log(sampleUser)
 let sampleUserName = ''
 if(sampleUser.name) {
  sampleUserName = sampleUser.name
 } else if(sampleUser.email) {
  sampleUserName = sampleUser.email
 }
  let returnObject = {sample: sample, userName: sampleUserName}
  response.status(200).send(returnObject)
  
})

app.get('/samples', async (request,response) => {
 
  let dateFilter = request.query.dateFilter

  let samples = await Sample.find({})
  if(!samples) {
    response.status(500).send({
      message: "No Samples Found"
    })
  }
  let vm = []
  let locations = await Location.find({})
  let users = await User.find({})
  samples.forEach(t => 
    vm.push({
    id: t._id.toString(),
    qr: t.qr,
    date: t.time,
    location: locations.find(l=>l._id == t.location.toString())?.name,
    user: users.find(u=>u._id == t.user.toString())?.email
  }))
  if(dateFilter) {
    
    let compareText = ''

    if(dateFilter == 1) {
      compareText = 'day'
    }
    if(dateFilter == 2) {
      compareText = 'month'
    }
    if(dateFilter == 3) {
      compareText = 'year'
    }
    if(compareText != '') {
      vm = vm.filter(t=> moment(t.date).isSame(new Date(),compareText))
    }

  }
  response.status(201).send({
    message: "Sample Created Successfully",
    vm,
  })
})

app.post('/samples', async (request, response) => {
  let user = await User.findOne({ email: request.body.user })
  if(!user) {
    response.status(500).send({
      message: "User couldn't be found",
      error,
    });
  }

  const sample = new Sample({
    qr: request.body.qr,
    time: new Date(),
    note: request.body.note,
    location: request.body.locationId,
    user: user._id
  });
  await sample.save().then((res) => {
    response.status(201).send({
      message: "Sample Created Successfully",
      res,
    })
  }).catch((error) => {
    response.status(500).send({
      message: "Error creating Sample",
      error,
    });
  });

});



app.post('/locations', async (request, response) => {
  const location = new Location({
    name: request.body.name,
  });
  await location.save().then((res) => {
    response.status(201).send({
      message: "Location Created Successfully",
      res,
    })
  }).catch((error) => {
    response.status(500).send({
      message: "Error creating location",
      error,
    });
  });

});

app.get('/tubes/types',  async (request,response) => {
  try {
  let types = await TubeType.find({})
  let vm = []
  
  types.forEach(t => vm.push({
    id: t._id.toString(),
    name: t.name 
  }))

  response.status(201).send({
    res: vm
  })
} catch(er) {
  throw er;
}
})


app.get('/tubes', async (request, response) => {

  let tubes = await Tube.find(({}))
  let tubeTypes = await TubeType.find({})
  tubes.forEach(tube => {
  });
    response.status(201).send({
      message: 'Tube Created Sucessfully',
      tubes,
  })
})

app.delete('/tubes/types/:id', async (req,res) => {
  try {
 await TubeType.findOneAndRemove({_id: req.params.id})
 res.status(201).send({
  message: "Type Deleted Sucessfully",
})
  } catch(ex) {
    throw ex
  }
})

app.post('/tubes/types', async (request, response) => {
  const type = new TubeType({
    name: request.body.name,
  });
  await type.save().then((res) => {
    response.status(201).send({
      message: "Type Created Successfully",
      res,
    })
  }).catch((error) => {
    response.status(500).send({
      message: "Error creating tube type",
      error,
    });
  });

});
// register endpoint
app.post("/register", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: request.body.email,
        name: request.body.name,
        password: hashedPassword,
      });
      // save the new user
      user
        .save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            message: "User Created Successfully",
            result,
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((e) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});

// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.json({ message: "You are authorized to access me" });
});

// login endpoint
app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email })

    // if email exists
    .then((user) => {
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)

        // if the passwords match
        .then((passwordCheck) => {

          // check if password matches
          if(!passwordCheck) {
            return response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          //   create JWT token
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          //   return success response
          response.status(200).send({
            message: "Login Successful",
            email: user.email,
            name: user.name,
            token,
          });
        })
        // catch error if password does not match
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});



module.exports = app;
