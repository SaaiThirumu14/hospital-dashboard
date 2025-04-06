const express = require("express");
const app = express();
const port = 4000;
const bodyParser = require("body-parser");
const mongooose = require("mongoose");
const passport = require("passport");
const methodOverRide = require("method-override");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const dotenv=require('dotenv')

dotenv.config()

app.set("view engine", "ejs"); // ejs file working
app.use(express.static("public")); //for making the css active
app.use(methodOverRide("_method")); //only for the use of put,get,post
app.use(bodyParser.urlencoded({ extended: true })); //transfer the data to the parsed page

app.use(
  session({
    secret: "hello@123",
    resave: true,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongooose.connect(
  process.env.MONGOID
);

const userSchema = new mongooose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const user = new mongooose.model("users", userSchema);

passport.use(user.createStrategy());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

const patients = mongooose.model("patients", {
  patient_id: Number,
  patient_Name: String,
  patient_age: Number,
  patient_mobile: Number,
  patient_address: String,
  patient_disease: String,
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    patients.find({}).then((data) => {
      if (data) {
        res.render("dashboard", { data });
      }
    });
  }
});

app.get("/addpatient", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("addpatient");
  }
});

app.get("/update/:id", (req, res) => {
  if (req.isAuthenticated()) {
    patients.findOne({ patient_id: req.params.id }).then((data) => {
      res.render("update", { data });
    });
  }
});

app.put("/update/:id", (req, res) => {
  patients
    .updateOne(
      { patient_id: req.params.id },
      {
        $set: {
          patient_id: req.body.patient_id,
          patient_Name: req.body.patient_Name,
          patient_age: req.body.patient_age,
          patient_address: req.body.patient_address,
          patient_mobile: req.body.patient_mobile,
          patient_disease: req.body.patient_disease,
        },
      }
    )
    .then((data) => {
      res.redirect("/dashboard");
    });
});

app.get("/delete/:id", (req, res) => {
  if (req.isAuthenticated()) {
    patients
      .deleteOne({ patient_id: req.params.id })
      .then((data) => {
        res.redirect("/dashboard");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.redirect("/");
  }
});

app.post("/addpatient", (req, res) => {
  const patient = new patients(req.body);
  patient.save().then(() => {
    res.render("addpatient");
  });
});

app.post("/", (req, res) => {
  /*
    user.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log(user);
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/")
            })
        }
    })
})
*/
  const users = new user({
    username: req.body.username,
    password: req.body.password,
  });

  req.logIn(users, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/dashboard"); //doubt
      });
    }
  });
});

app.listen(port, () => {
  console.log(`server is up and running ${port}`);
});
