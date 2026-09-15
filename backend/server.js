require("dotenv").config(); // Must be first — loads env vars before anything else reads them

const app       = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

connectDB();

// Render (and most PaaS) requires binding to 0.0.0.0, not just localhost
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});