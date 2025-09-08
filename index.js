const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const connectDB = require("./db/db");
const rootRouter = require("./routes/index");
const WebSocketServer = require("./websocket/websocketServer");
const app = express();

require("dotenv").config();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/v1", rootRouter);

connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Make wsServer available to routes
app.set('wsServer', wsServer);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is ready for connections`);
});
