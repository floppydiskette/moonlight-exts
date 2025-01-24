const cssList = {};

function addGlobalCSS(name, css) {
  if (cssList[name] != null) return;

  const head = document.documentElement;
  let style = document.createElement("style");
  style.classList.add("moonlight-css");
  style.innerHTML = css;
  cssList[name] = style;
  head.appendChild(style);
}

function updateGlobalCSS(name, css) {
  if (!cssList[name]) {
    addGlobalCSS(name, css);
  } else {
    cssList[name].innerHTML = css;
  }
}

function deleteGlobalCSS(name, css) {
  if (cssList[name]) {
    cssList[name].remove();
    delete cssList[name];
  }
}

function isURL(str) {
  try {
    let url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

module.exports.webpackModules = {
  entrypoint: {
    entrypoint: true,
    run: (module, exports, require) => {
      const logger = moonlight.getLogger("moonlight-css");

      const natives = moonlight.getNatives("moonlight-css");
      const cssPath = moonlight.getConfigOption("moonlight-css", "cssPath");
      if (cssPath === undefined || cssPath.length === 0) {
        logger.error("cssPath not set");
        return;
      }

      if (natives === undefined) {
        logger.error("Failed to get natives");
        return;
      }

      // check if cssPath is a url
      if (isURL(cssPath)) {
        natives.loadCssFromUrl(cssPath).then(css => {
          addGlobalCSS("url", css);
        });
      } else {

        const fwResult = natives.getFileWatcher(cssPath);
        if (!fwResult) {
          logger.error("Failed to get file watcher");
          return;
        }
        const { cssList: loadCssList, emitter } = fwResult;

        if (emitter === undefined || loadCssList === undefined) {
          logger.error("File watcher failed to properly return");
          return;
        }

        logger.trace(loadCssList, emitter);

        if (typeof loadCssList === "object" && Object.keys(loadCssList).length > 0) {
          Object.keys(loadCssList).forEach(filename => {
            addGlobalCSS(filename, loadCssList[filename]);
          });
        }

        emitter.subscribe("new", (newCss) => {
          logger.debug(`New css file ${newCss.filename}`);
          addGlobalCSS(newCss.filename, newCss.css);
        });

        emitter.subscribe("change", (newCss) => {
          logger.debug(`Changed css file ${newCss.filename}`);
          updateGlobalCSS(newCss.filename, newCss.css);
        });

        emitter.subscribe("remove", (filename) => {
          logger.debug(`Removed css file ${filename}`);
          deleteGlobalCSS(filename);
        });

        // natives.loadCssFromFiles(cssPath).forEach(css => {
        //   addGlobalCSS(css);
        // });
      }
    }
  }
};