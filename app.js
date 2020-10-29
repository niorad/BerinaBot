const fetch = require("node-fetch");
const jsdom = require("jsdom");
const fs = require('fs');
const { JSDOM } = jsdom;
const config = require('./config.json');
const Discord = require("discord.js");
const { exit } = require("process");


async function getCurrentProducts() {
   const response = await fetch(config.DATA_SOURCE_URLS[0]);
   const html = await response.text();
   const dom = new JSDOM(html);
   const products = Array.from(
      dom.window.document.querySelectorAll(".product-tile")
   );
   return products.map((item) => {
      return `${item.querySelector("[itemprop=name]").content}§§§${config.BASE_URL}${item.querySelector(".product-link").href}`;
   });
}


async function getLastProductList() {
   if(fs.existsSync('./_results.json')) {
      const rawData = fs.readFileSync('./_results.json')
      return JSON.parse(rawData);
   } else {
      await fs.writeFile('./_results.json');
      return [];
   }
}


// Get all new Items from current that are not in lastSaved
function getNewProducts(current, lastSaved) {
   return current.reduce((acc, cur, index) => {
      if(lastSaved.indexOf(cur) === -1 && index < 2) {
         return [...acc, cur];
      } else {
         return acc;
      }
   }, []);
}

function postNewProductsToDiscord(products) {

   const client = new Discord.Client();
   client.login(config.BOT_TOKEN);

   let message = 'Halli! Sieht aus als gäbe es neue POPs!';

   const list = products.reduce((acc, val) => {
      const title = val.split('§§§')[0];
      const link = val.split('§§§')[1];
      return `${acc}\n ${title}: ${link}`;
   }, '');

   client.on("ready", () => {
      client.channels.cache.get(config.CHANNEL_ID).send(`${message}${list}`).then(() => {
         client.destroy();
         return process.exit(1);
      });

   });

}

getCurrentProducts().then(currentProducts => {
   getLastProductList().then(lastProductList => {
      const newProducts = getNewProducts(currentProducts, lastProductList);
      if(newProducts.length > 0) {
         postNewProductsToDiscord(newProducts);
      }
   });
});