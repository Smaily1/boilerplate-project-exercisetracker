const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({ extended: false }))

//Connecting to the database
const mySecret = process.env['DB_URI']

mongoose.connect(mySecret, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
}).then(()=>{
  console.log('database connected.')
}).catch((err) => console.log(err.message))

//Database Schema
var exerciseSchema = new mongoose.Schema({
        date : Date,
        duration : {type: Number,required: true},
        description : {type: String,required: true}
})

var userSchema = new mongoose.Schema({
        username: String,
        log : [exerciseSchema]
        
      });

var Exercise = mongoose.model('Exercise', exerciseSchema)
var TRACKER = mongoose.model("TRACKER", userSchema);



// Post the Username
app.post('/api/users',async (req,res)=>{
let user = req.body.username

TRACKER.findOne({ username: user },async (err,data)=>{
  if(data == null) {
        const dbUser = new TRACKER({
        username: user,
      });

      dbUser.save();

var userR = await TRACKER.findOne({ username: user, })

res.json(userR)
  } else {
      res.send("Username already taken")
  }
})
})


//Show all users in the database
app.get('/api/users',async (req,res)=>{

  var userR = await TRACKER.find()

res.json(userR)

} )


//Add Exercises

app.post('/api/users/:id/exercises',async (req,res)=>{
  let id = req.params.id
  let description = req.body.description
  let duration = req.body.duration
  let date = req.body.date

  let newSession = new Exercise({
      description : description,
      duration : parseInt(duration),
      date : date
  })

  if(newSession.date == null){
    newSession.date = new Date().toDateString()
  }
    
    TRACKER.findByIdAndUpdate(id , 
    {$push : {log : newSession}} ,
    {new: true},
    (error, updatedUser )=>{
      if(!error){
        let resObj = {}
        resObj['_id'] = updatedUser.id
        resObj['username'] = updatedUser.username
        resObj['date'] = new Date(newSession.date).toDateString()
        resObj['duration'] = newSession.duration
        resObj['description'] = newSession.description
        res.json(resObj)
      }
    }
    )

} )


// Show All Exercses 
app.get("/api/users/:_id/logs", (req,res)=>{
  let id = req.params._id 
  
TRACKER.findById( id , 
    (error, data )=>{
      if(!error){
        let resObj = {}
         // This is the Scond part

        if(req.query.from || req.query.to) {
              let fromDate = new Date(0)
              let toDate = new Date()
              
              if(req.query.from) {
                fromDate = new Date(req.query.from)
              }
              if(req.query.to){
                toDate = new Date(req.query.to)
              }

              data.log = data.log.filter((exerciseItem)=>{
                exerciseItemDate = new Date(exerciseItem.date)

                return exerciseItemDate.getTime() >= fromDate.getTime()
                && exerciseItemDate.getTime()<= toDate.getTime()
              })
        }

        // This is the first one which stopped 
        if(req.query.limit){
          
          data.log = data.log.slice(0,req.query.limit)
          console.log(data.log)
        }
        resObj['_id'] = data.id
        resObj['username'] = data.username
        resObj['count'] = data.log.length
        resObj['log'] = data.log

       
        res.json(resObj)
      }
    }
    )
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
