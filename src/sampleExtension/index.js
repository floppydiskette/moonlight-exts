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
      const config = moonlight.getConfig("moonlight-css");
      if (!config.hasOwnProperty("cssPath")) {
        logger.error("cssPath not set");
        return;
      }
      natives.loadCssFromFiles(config.cssPath).forEach(css => {
        addGlobalCSS(css);
      });
    }
  }
};