const http = require("http");

const port = process.env.PORT;

http
  .get(`http://localhost:${port}/health`, (res) => {
    process.exit(res.statusCode === 200 ? 0 : 1);
  })
  .on("error", () => {
    process.exit(1);
  });
