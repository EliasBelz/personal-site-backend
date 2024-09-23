/*
 * Name: Elias Belzberg
 * Date: May 19, 2023
 * Section: CSE 154 AD
 *
 * This code converts images to ascii based on the brightness of pixels.
 * Backend code contains 2 Endpoints for uploading images and modifying program settings.
 *
 * Reference for brightness values:
 * http://paulbourke.net/dataformats/asciiart/
 *
 * Reference for image processing:
 * https://www.npmjs.com/package/jimp
 */

'use strict';
const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const app = express();
app.use(multer().none());

const CHARS_SMALL = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];

const CHARS_BIG = [" ", ".", "'", "`", "^", "\"", ",", ":", ";", "I", "l", "!", "i", ">", "<", "~",
                  "+", "_", "-", "?", "]", "[", "}", "{", "1", ")", "(", "|", "\\", "/", "t", "f",
                   "j", "r", "x", "n", "u", "v", "c", "z", "X", "Y", "U", "J", "C", "L", "Q", "0",
                  "O", "Z", "m", "w", "q", "p", "d", "b", "k", "h", "a", "o", "*", "#", "M", "W",
                  "&", "8", "%", "B", "@", "$"];

const RANDOM_EXAMPLE_URLS = [
  "https://media.sproutsocial.com/uploads/meme-example.jpg",
  "https://www.theinterrobang.ca/images/interrobang/030819/B8QC6DAZ9PWRK7M2.jpg",
  "https://www.lpl.com/content/dam/lpl-www/images/newsroom/read/insider/insider-blog-meme-stocks-what-do-they-mean_article-hero-450x450.png",
  "https://imageio.forbes.com/specials-images/imageserve/6322129e876c6dd61a451586/zelda-tears-of-the-kingdom-715x400/960x0.png?format=png&width=960",
  "https://www.zelda.com/tears-of-the-kingdom/_images/game/logo-shadow.png",
  "https://alphagammadelta.org/wp-content/uploads/2017/01/U-Washington.jpg",
  "https://lazowska.cs.washington.edu/GatesCenter.jpg",
  "https://m.media-amazon.com/images/I/61zLPovRaIL.jpg",
  "https://images.seattletimes.com/wp-content/uploads/2016/08/huskyheadlines_cover.jpg?d=780x520",
  "https://files.realpython.com/media/hi_res_plot.832200ce2275.png",
  "https://magazine.washington.edu/columns_wordpress/wp-content/uploads/2021/06/dubs3.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTC0PR064Z1RtLDFB7MLtaz23bkUtosG74y2r7PU-O8tQ&usqp=CAU&ec=48665699"
];

// Default settings
let currCharSet = CHARS_SMALL;
let currWidth = 150;
let currHeight = Jimp.AUTO;

/**
 * Endpoint for uploading a images url
 * Sends ascii art as plain text
 */
app.get("/generateAscii", async (req, res) => {
  const {url = RANDOM_EXAMPLE_URLS[Math.floor(Math.random() * RANDOM_EXAMPLE_URLS.length)],
     inverted = "false"} = req.query;
  console.log(url);


  res.type("text");
  if (url) {
    try {
      res.send(await genBitMap(url, inverted.toLowerCase() === "true"));
    } catch (err) {
      res.status(500).send('Function Error');
    }
  } else {
    res.status(400).send('Error, Bad url!');
  }
});

/**
 * Endpoint for modifying ascii art settings
 *
 * The 30 line function limit here feels overly restrictive.
 * You cannot pass req to a helper function to split up the code,
 * and there is a lot of boilerplate to verify all the parameters are correct
 * and for making the nested Json response.
 */
app.post("/settings", (req, res) => {
  try {
    let charSet = req.body.charSet;
    if (charSet) {
      if (!(charSet === "SMALL" || charSet === "BIG")) {
        throw new Error("Invalid charSet. Select BIG or SMALL.");
      }
      if (charSet === "SMALL") {
        currCharSet = CHARS_SMALL;
      } else {
        currCharSet = CHARS_BIG;
      }
    }
    let width = req.body.width;
    if (width) {
      if (parseInt(width) < 0 || parseInt(width) > 500) {
        throw new Error("Invalid width. Out of range 0 - 500.");
      }
      if (parseInt(width) === 0) {
        currWidth = Jimp.AUTO;
      } else {
        currWidth = parseInt(width);
      }
    }
    let height = req.body.height;
    if (height) {
      if (parseInt(height) < 0 || parseInt(height) > 500) {
        throw new Error("Invalid height. Out of range 0 - 500.");
      }
      if (parseInt(height) === 0) {
        currHeight = Jimp.AUTO;
      } else {
        currHeight = parseInt(height);
      }
    }
    let settings = {};
    settings.charSet = {};
    settings.charSet.value = currCharSet.toString();
    settings.width = {};
    if (currWidth === -1) {
      settings.width.value = "Jimp.AUTO";
    } else {
      settings.width.value = currWidth;
    }
    settings.height = {};
    if (currHeight === -1) {
      settings.height.value = "Jimp.AUTO";
    } else {
      settings.height.value = currHeight;
    }
    res.json(settings);
  } catch (err) {
    res.type("text");
    res.status(400).send(err.toString());
  }
});

/**
 * Helper function for processing image
 * @param {String} url image url
 * @returns {String} ascii art
 */
async function genBitMap(url, inverted = false) {
  try {
    let img = await Jimp.read(url);
    img.resize(currWidth, currHeight);
    img.greyscale();
    let brightness = [];
    let charSet = inverted?  currCharSet.reverse() : currCharSet;

    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
      let red = this.bitmap.data[idx + 0];
      let green = this.bitmap.data[idx + 1];
      let blue = this.bitmap.data[idx + 2];
      brightness.push((red + green + blue) / 3);
    });

    let out = "";
    for (let i = 0; i < brightness.length; i++) {
      if (i !== 0 && i % img.bitmap.width === 0) {
        out += "\n";
      }
      let linear = 1 - (brightness[i] / 255.0);
      out += charSet[Math.round(linear * (charSet.length - 1))];
    }
    return out;
  } catch (Err) {
    throw new Err;
  }
}

const PORT = process.env.PORT || 3001;
app.use(express.static('public'));
app.listen(PORT);

module.exports = app;
