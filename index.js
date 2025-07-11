const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./db/db");
const rootRouter = require("./routes/index");
const app = express();

require("dotenv").config();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/v1", rootRouter);

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
