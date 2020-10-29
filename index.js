const Discord = require("discord.js");

const client = new Discord.Client();
client.login(config.BOT_TOKEN);

  client.on("ready", () => {
    // client.channels.cache.get(config.CHANNEL_ID).send(JSON.stringify(names));
    console.log("Posting to chat: ", JSON.stringify(names));
  });
