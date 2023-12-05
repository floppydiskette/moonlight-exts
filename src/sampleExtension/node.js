const fs = require("fs");

module.exports.loadCssFromFiles = (path) => {
  const logger = moonlightNode.getLogger("moonlight-css");

  let csses = [];

  if (!fs.existsSync(path)) {
    logger.error(`${path} doesn't exist`);
    return [];
  }

  fs.readdirSync(path).forEach(file => {
    const content = fs.readFileSync(`${path}/${file}`, {encoding: "utf8"});
    csses.push(content);
  })
  return csses;
};