import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
const logger = moonlight.getLogger("levantine");
const natives = moonlight.getNatives("levantine");
Dispatcher.addInterceptor((data) => {
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
});
