const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const config = require('./config.json');
const Discord = require("discord.js");

const client = new Discord.Client();
client.login(config.BOT_TOKEN);

const shopHtml = async () => {
  const response = await fetch(config.DATA_SOURCE_URL);
  return response.text();
};

shopHtml().then((data) => {

  const dom = new JSDOM(data);

  const products = Array.from(
    dom.window.document.querySelectorAll(".product-link")
  );

  const names = products.map((item) => {
    return item.querySelector("[itemprop=name]").content;
  });

  client.on("ready", () => {
    client.channels.cache.get(config.CHANNEL_ID).send(names);
  });

});
