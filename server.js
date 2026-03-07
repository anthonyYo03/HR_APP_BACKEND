import ConnectDB from "./db/db.js";
import dotenv from "dotenv"
import express from "express"
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js'
import announcementRoutes from './routes/announcement.routes.js'
import reportRoutes from "./routes/reportIssue.routes.js"
import requestsRoutes from "./routes/request.routes.js"
import taskRoutes from "./routes/task.routes.js"
import notificationRoutes from './routes/notification.routes.js'
import { setIo } from './utils/socketManager.js'
import { secretKey } from './middlewares/config.js'

dotenv.config();
const app=express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
});

setIo(io);

// Socket.IO authentication middleware
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie || '';
  const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('token='));
  if (!tokenCookie) {
    return next(new Error('Unauthorized: no token'));
  }
  const token = tokenCookie.trim().slice('token='.length);
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return next(new Error('Unauthorized: invalid token'));
    }
    socket.userId = decoded.userId;
    next();
  });
});

io.on('connection', (socket) => {
  socket.join(socket.userId.toString());
  socket.on('disconnect', () => {});
});

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
httpServer.listen(port,()=>{
    console.log(`Server is listening on port ${port}`);
})


ConnectDB();