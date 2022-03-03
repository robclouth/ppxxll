const ThreadsPlugin = require("threads-plugin");
const path = require("path");

module.exports = {
  babel: {
    presets: [],
    plugins: [],
  },
  typescript: {
    enableTypeChecking: true,
  },
  webpack: {
    alias: {
      three$: path.resolve("./src/three.js"),
    },
    plugins: {
      add: [new ThreadsPlugin()],
      remove: [],
    },
  },
};
