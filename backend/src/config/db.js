const mongoose = require("mongoose")




async function connectDB() {
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("DataBase Connected")
    }
    catch(err){
        console.log("Database Connection Failed: ",err.message)
    }
}

module.exports = connectDB;