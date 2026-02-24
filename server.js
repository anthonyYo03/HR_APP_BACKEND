import ConnectDB from "./db/db.js";
import dotenv from "dotenv"
import express from "express"
import cors from 'cors'
import userRoutes from './routes/user.routes.js'
import cookieParser from 'cookie-parser';
import announcementRoutes from './routes/announcement.routes.js'
import reportRoutes from "./routes/reportIssue.routes.js"
import requestsRoutes from "./routes/request.routes.js"
import taskRoutes from "./routes/task.routes.js"
import notificationRoutes from './routes/notification.routes.js'

dotenv.config();
const app=express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());
app.use('/user',userRoutes);
app.use('/announcement',announcementRoutes);
app.use('/reportIssue',reportRoutes);
app.use('/request',requestsRoutes);
app.use('/task',taskRoutes);
app.use('/notification',notificationRoutes);

const port=process.env.PORT
app.listen(port,()=>{
    console.log(`Server is listening on port ${port}`);
})


ConnectDB();