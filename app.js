const fetch = require("node-fetch");
const jsdom = require("jsdom");
const fs = require('fs');
const { JSDOM } = jsdom;
const config = require('./config.json');
const Discord = require("discord.js");


function generateProductLists(products) {
   return products.map((list) => {
      return list.map((item) => {
         return `${item.querySelector("[itemprop=name]").content}§§§${config.BASE_URL}${item.querySelector(".product-link").href}`;
      });
   });
}

async function getCurrentProducts() {
   let products = [];

   for(let i = 0; i < config.DATA_SOURCE_URLS.length; i++) {
      const response = await fetch(config.DATA_SOURCE_URLS[i]);
      const html = await response.text();
      const dom = new JSDOM(html);
      products.push(Array.from(dom.window.document.querySelectorAll(".product-tile")));
   }

   return generateProductLists(products);
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

   //trim to 6 per list
   const trimmedNewProductLists = current.map((list) => list.slice(0,3));
   const flattenedNewProducts = trimmedNewProductLists.flat(1);
   const dedupedCurrentProducts = [...new Set(flattenedNewProducts)];
   const dedupedLastProducts = [...new Set(lastSaved)];

   return dedupedCurrentProducts.reduce((acc, cur) => {
      if(dedupedLastProducts.indexOf(cur) === -1) {
         return [...acc, cur];
      } else {
         return acc;
      }
   }, []);
}


async function postNewProductsToDiscord(products) {

   const client = new Discord.Client();
   client.login(config.BOT_TOKEN);

   client.on("ready", async () => {
      await client.channels.cache.get(config.CHANNEL_ID).send(`${config.GREETING}`);

      for(let i = 0; i < products.length; i++) {
         await client.channels.cache.get(config.CHANNEL_ID).send(products[i].split('§§§')[1])
      }

      client.destroy();
      return process.exit(1);
   });
}

async function storeNewProductList(products) {
   fs.writeFileSync('./_results.json', JSON.stringify(products.flat()));
}

getCurrentProducts().then(currentProducts => {
   getLastProductList().then(lastProductList => {
      storeNewProductList(currentProducts).then(() => {
         const newProducts = getNewProducts(currentProducts, lastProductList);
         if(newProducts.length > 0) {
            console.log(newProducts);
            postNewProductsToDiscord(newProducts);
         }
      });
   });
});