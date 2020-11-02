const fetch = require("node-fetch");
const jsdom = require("jsdom");
const fs = require('fs');
const { JSDOM } = jsdom;
const config = require('./config.json');
const Discord = require("discord.js");


async function getCurrentProducts() {

   let products = [];

   for(let i = 0; i < config.DATA_SOURCE_URLS.length; i++) {
      const response = await fetch(config.DATA_SOURCE_URLS[i]);
      const html = await response.text();
      const dom = new JSDOM(html);
      products.push(Array.from(dom.window.document.querySelectorAll(".product-tile")));
   }


   console.log(products.flat());

   return products.flat().map((item) => {
      return `${item.querySelector("[itemprop=name]").content}§§§${config.BASE_URL}${item.querySelector(".product-link").href}`;
   });
}


async function getLastProductList() {
   if(fs.existsSync('./_results.json')) {
      const rawData = fs.readFileSync('./_results.json')
      return JSON.parse(rawData);
   } else {
      fs.writeFileSync('./_results.json', '[]');
      return [];
   }
}


// Get all new Items from current that are not in lastSaved
function getNewProducts(current, lastSaved) {
   return current.reduce((acc, cur, index) => {
      if(lastSaved.indexOf(cur) === -1 && index < 5) {
         return [...acc, cur];
      } else {
         return acc;
      }
   }, []);
}

function postNewProductsToDiscord(products) {

   const client = new Discord.Client();
   client.login(config.BOT_TOKEN);

   const list = products.reduce((acc, val) => {
      // const title = val.split('§§§')[0];
      const link = val.split('§§§')[1];
      return `${acc}\n ${link}`;
   }, '');

   client.on("ready", () => {
      client.channels.cache.get(config.CHANNEL_ID).send(`${config.GREETING}${list}`).then(() => {
         client.destroy();
         return process.exit(1);
      });
   });
}

async function storeNewProductList(products) {
   fs.writeFileSync('./_results.json', JSON.stringify(products));
}

getCurrentProducts().then(currentProducts => {
   const dedupedCurrentProducts = [...new Set(currentProducts)];
   getLastProductList().then(lastProductList => {
      storeNewProductList(dedupedCurrentProducts).then(() => {
         const newProducts = getNewProducts(dedupedCurrentProducts, lastProductList);
         if(newProducts.length > 0) {
            postNewProductsToDiscord(newProducts);
         }
      });
   });
});