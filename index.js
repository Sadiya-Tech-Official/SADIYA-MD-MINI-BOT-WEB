const express = require("express");
const cors = require("cors");
const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

//==================html================================================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
//=====================================================================================================

module.exports = app;
