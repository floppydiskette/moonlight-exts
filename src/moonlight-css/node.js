const fs = require("fs");
const nodePath = require("path");
const sass = require("sass");


const fileSelector = moonlightNode.getConfigOption("moonlight-css", "fileSelector");

const selectionRegex = new RegExp(
  (typeof fileSelector === "string" && fileSelector.length > 0) ? fileSelector : ".+", "g"
);

const recurseDirectory = moonlightNode.getConfigOption("moonlight-css", "recurseDirectory");

const cssRegex = /.*\.(css|scss|sass)$/g;
const sassRegex = /.*\.(scss|sass)$/g;

const logger = moonlightNode.getLogger("moonlight-css");

class Emitter {
  listeners = [];

  emit = (event, arg) => {
    this.listeners.forEach(listener => {
      if (listener.type === event) {
        listener.callback(arg);
      }
    });
  };

  subscribe = (type, callback) => {
    this.listeners.push({type, callback});
  };
}

const readCssFile = (filePath) => {
  const filename = nodePath.basename(filePath);
  const isSass = filename.match(sassRegex);
  let finalCss = "";
  if (isSass) {
    logger.info(`Compiling sass file at ${filePath}`);
    const compiled = sass.compile(filePath, {
      style: "expanded"
    });
    logger.trace("Compiled sass file", compiled);
    finalCss = compiled.css;
  } else {
    logger.trace("Treated as css");
    finalCss = fs.readFileSync(filePath, {encoding: "utf8"});
  }

  return finalCss;
};

const getFileWatcher = (path) => {
  const cssDir = getCssList(path);
  if (!cssDir) {
    logger.error(`Failed to get css list for ${path}, getCssList returned undefined`);
    return undefined;
  }
  const {pathList, emitter: dirEmitter} = cssDir;
  if (!pathList || !dirEmitter) {
    logger.error(`Failed to get css list for ${path}, pathList or emitter was undefined`);
    return;
  }
  const emitter = new Emitter();
  const cssList = {};

  logger.trace("fwPathList", pathList);

  // handle files found at runtime
  pathList.forEach(css => {
    logger.trace(`css file @ ${css}`);
    cssList[nodePath.basename(css)] = readCssFile(css);
    logger.trace("cssList", nodePath.basename(css), cssList[nodePath.basename(css)]);
    fs.watch(css, (eventType, filename) => {
      const fullPath = `${path}/${filename}`;
      switch (eventType) {
      case "change": {
        emitter.emit("change", {
          filename,
          css: readCssFile(fullPath)
        });
        break;
      }
      case "rename": {
        if (!fs.existsSync(fullPath)) {
          emitter.emit("remove", filename);
        }
        // file could possibly be dead at this point
        break;
      }
      }
    });
  });

  // handle new files emitted by the directory watcher
  dirEmitter.subscribe("new", (filePath) => {
    emitter.emit("new", {
      filename: nodePath.basename(filePath),
      css: readCssFile(filePath)
    });
    fs.watch(filePath, (eventType, filename) => {
      const fullPath = `${path}/${filename}`;
      switch (eventType) {
      case "change": {
        emitter.emit("change", {
          filename,
          css: readCssFile(fullPath)
        });
        break;
      }
      case "rename": {
        if (!fs.existsSync(fullPath)) {
          emitter.emit("remove", filename);
        }
        break;
      }
      }
    });
  });
  dirEmitter.subscribe("remove", (filePath) => {
    emitter.emit("remove", nodePath.basename(filePath));
  });

  return {
    emitter,
    cssList
  };
};

const getCssList = (path) => {
  if (!fs.existsSync(path)) {
    logger.error(`${path} doesn't exist`);
    return undefined;
  }

  // get ALL files in this directory
  let dir;
  if (fs.lstatSync(path).isDirectory()) {
    dir = fs.readdirSync(path, {recursive: recurseDirectory === true});
  } else {
    dir = [nodePath.basename(path)];
    path = path.substring(0, path.length - dir[0].length);
  }
  const tracked = [];
  
  const filteredList = dir.filter(filename => {
    if (Buffer.isBuffer(filename)) {
      filename = filename.toString();
    }
    filename = filename.trim();
    let fullPath = `${path}/${filename}`;
    let stat = fs.lstatSync(fullPath);
    if (!stat.isFile() && !stat.isSymbolicLink()) {
      logger.trace("not file or symlink", filename);
      return false;
    }
    const cssTest = filename.match(cssRegex);
    const selectionTest = filename.match(selectionRegex);
    logger.trace("fullPath", fullPath, filename, cssRegex, selectionRegex, cssTest, selectionTest);
    if (!cssTest) {
      logger.trace("css regex failed", filename);
      return false;
    }
    if (!selectionTest) {
      logger.trace("selection test failed", filename);
      return false;
    }
    return true;
  });
  const pathList = filteredList.map(filename => `${path}/${filename}`);
  logger.trace("pathList", filteredList, pathList);
  pathList.forEach(path => {
    tracked.push(nodePath.basename(path));
  });
  const emitter = new Emitter();
  fs.watch(path, {
    recursive: recurseDirectory === true
  }, (eventType, filename) => {
    if (!filename || !filename.match(cssRegex) || !filename.match(selectionRegex)) {
      return;
    }
    const fullPath = `${path}/${filename}`;
    switch (eventType) {
    case "rename": {
      if (fs.existsSync(fullPath) && !tracked.includes(filename)) {
        tracked.push(filename);
        emitter.emit("new", fullPath);
      } else if(tracked.includes(filename)) {
        tracked.splice(tracked.indexOf(filename), 1);
        emitter.emit("remove", fullPath);
      }
      break;
    }
    }
  });
  return {
    emitter,
    pathList
  };
};

module.exports = {
  getFileWatcher
};