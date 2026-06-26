const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Transporter Partner Performance Rating System API is running on port ${PORT}`);
});
