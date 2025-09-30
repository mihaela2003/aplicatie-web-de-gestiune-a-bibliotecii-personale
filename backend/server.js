require('dotenv').config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const routes = require('./routes/index');

// Importă modelele și legăturile
require('./models/index');

const app = express();
app.use(express.json());
app.use(cors());

sequelize.sync({force: false, alter: true})
  .then(() => console.log("Baza de date sincronizată!"))
  .catch(err => console.error("Eroare la sincronizare:", err));

app.use('/api', routes);

app.listen(3001, () => console.log("Serverul rulează pe portul 3001"));
