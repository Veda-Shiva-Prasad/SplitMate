const mongoose = require("mongoose");
const dns = require("node:dns");

// Atlas "mongodb+srv://" URIs need a DNS SRV lookup, which fails on some
// networks. Use public DNS only for those URIs, so a local/Docker
// "mongodb://mongo:27017" connection keeps using the normal resolver.
if ((process.env.MONGO_URI || "").startsWith("mongodb+srv://")) {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set.");
  }

  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
