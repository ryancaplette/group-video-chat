import express, { Application } from "express";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createHTTPSServer, Server as HTTPSServer } from "https";
import { createServer as createHTTPServer, Server as HTTPServer } from "http";
import {v4} from "uuid";
import path from "path";
import fs from "fs";

export class Server {
  private httpServer: HTTPSServer|HTTPServer;
  private app: Application;
  private io: SocketIOServer;

  private readonly DEFAULT_PORT = parseInt(process.env.PORT) || 5000;

  constructor() {
    const ssl:boolean = (process.env.SSL == 'true') || false;
    const createServer = ssl ? createHTTPSServer : createHTTPServer;
    const serverOptions = ssl ? {
      key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
    } : {};

    this.app = express();
    this.httpServer = createServer(serverOptions,this.app)
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*'
      }
    });

    this.serveViews();
    this.serveRoutes();
    this.signalingProtocol();
  }

  private serveViews(): void {
    // this.app.set('view engine', 'ejs')
    this.app.use(express.static(path.join(__dirname, "public")));
  }

  private serveRoutes(): void {
    this.app.get('/', (req, res) => {
        res.redirect(`/${v4()}`)
    })
    
    this.app.get('/:room', (req, res) => {
        res.sendFile('./public/room.html', { root: __dirname });
    })
  }

  private signalingProtocol(): void {
    this.io.on("connection", socket => {
        socket.on('joining-room', (roomId, userId) => {
            socket.join(roomId)
            socket.to(roomId).broadcast.emit('new-user', userId)
            socket.on('disconnect', () => {
                socket.to(roomId).broadcast.emit('user-disconnected', userId)
            })
        })
    });
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}
