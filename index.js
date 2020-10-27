const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const config = require('./config.json');
const Discord = require("discord.js");

let lastAvailableProducts = [];

// check if file exists
if(fs.existsSync('./list.json')) {
  console.log("FILE EXISTS");
  const rawData = fs.readFileSync('./list.json')
  lastAvailableProducts = JSON.parse(rawData);
} else {
  lastAvailableProducts = [];
}



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
