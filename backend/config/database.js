const mongoose = require('mongoose')

const connectDatabase=()=>{
    mongoose.connect("mongodb://localhost:27017/").then(con=>{
        console.log(`MongoDB is connected to the host ${con.connection.host}`)
    })
}

module.exports=connectDatabase