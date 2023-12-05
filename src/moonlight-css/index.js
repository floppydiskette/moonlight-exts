function addGlobalCSS(css) {
  const head = document.getElementsByTagName("head")[0];
  let style = document.createElement("style");
  style.classList.add("moonlight-css");
  style.innerHTML = css;
  head.appendChild(style);
}

module.exports.webpackModules = {
  entrypoint: {
    entrypoint: true,
    run: (module, exports, require) => {
      const logger = moonlight.getLogger("moonlight-css");

      const natives = moonlight.getNatives("moonlight-css");
      const cssPath = moonlight.getConfigOption("moonlight-css", "cssPath");
      if (cssPath === undefined) {
        logger.error("cssPath not set");
        return;
      }
      natives.loadCssFromFiles(cssPath).forEach(css => {
        addGlobalCSS(css);
      });
    }
  }
};