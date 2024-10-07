module.exports.patches = [
  {
    find: "_dispatchWithDevtools(",
    replace: {
      match: /_dispatchWithDevtools\((.)\){this\._dispatchWithLogging\(.\)}/,
      replacement: (_, event) =>
        `_dispatchWithDevtools(${event}){require("levantine_intercept").interceptor(${event},${event}=>{this._dispatchWithLogging(${event})})}`
    }
  }
];

module.exports.webpackModules = {
  entrypoint: {
    entrypoint: true,
    run: (module, exports, require) => {
    }
  },
  intercept: {
    run: function(e, esExport, wrequire) {
      const logger = moonlight.getLogger("levantine");
      const natives = moonlight.getNatives("levantine");
      esExport.interceptor = async function(data, cb) {
        if (data.type === "LOAD_MESSAGES_SUCCESS") {
          // set all message content in messages array
          if (data.hasOwnProperty("messages") && Array.isArray(data.messages)) {
            data.messages.forEach((message) => {
              if (message.hasOwnProperty("content") && typeof message.content === "string") {
                message.content = natives.obfs(message.content);
              }
            });
          }
        }
        if (data.type === "MESSAGE_CREATE" || data.type === "MESSAGE_UPDATE") {
          if (data.hasOwnProperty("message") && data.message.hasOwnProperty("content") && typeof data.message.content === "string") {
            data.message.content = natives.obfs(data.message.content);
          }
        }
        if (data) cb(data);
      };
      e = esExport.default;
    }
  }
};