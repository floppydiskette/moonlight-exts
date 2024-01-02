const fs = require("fs");

module.exports.loadCssFromFiles = (path) => {
  const logger = moonlightNode.getLogger("moonlight-css");

  let csses = [];

  if (!fs.existsSync(path)) {
    logger.error(`${path} doesn't exist`);
    return [];
  }

  fs.readdirSync(path).forEach(file => {
    let fp = `${path}/${file}`;
    // don't try to read anything but files
    if (!fs.lstatSync(fp).isFile() && !fs.lstatSync(fp).isSymbolicLink()) {
      return;
    }
    // don't try to read files that aren't a .css (kinda hacky but oh well)
    if (!fp.endsWith(".css")) {
      return;
    }
    const content = fs.readFileSync(fp, {encoding: "utf8"});
    csses.push(content);
  })
  return csses;
};