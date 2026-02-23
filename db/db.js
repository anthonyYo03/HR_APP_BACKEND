import mongoose from "mongoose";

async function ConnectDB() {
    
try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Succesfully Connected to the Database');
} catch (error) {
 console.log('Cannot Connect to DB',error);   
}


}

export default ConnectDB;