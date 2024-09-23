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
import cors from 'cors';
const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const app = express();
app.use(multer().none());
app.use(cors({
  origin: '*'
}));

const CHARS_SMALL = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];

const CHARS_BIG = [" ", ".", "'", "`", "^", "\"", ",", ":", ";", "I", "l", "!", "i", ">", "<", "~",
                  "+", "_", "-", "?", "]", "[", "}", "{", "1", ")", "(", "|", "\\", "/", "t", "f",
                   "j", "r", "x", "n", "u", "v", "c", "z", "X", "Y", "U", "J", "C", "L", "Q", "0",
                  "O", "Z", "m", "w", "q", "p", "d", "b", "k", "h", "a", "o", "*", "#", "M", "W",
                  "&", "8", "%", "B", "@", "$"];

// Default settings
let currCharSet = CHARS_SMALL;
/**
 * Endpoint for uploading a images url
 * Sends ascii art as plain text
 */
app.post("/ascii", async (req, res) => {
  const {url, width = 110, inverted = "false"} = req.body;
  res.type("text");
  if (url) {
    try {
      res.send(await genBitMap(url, width, inverted.toLowerCase() === "true"));
    } catch (err) {
      res.status(500).send('Function Error');
    }
  } else {
    res.status(400).send('Error, Bad url!');
  }
});

/**
 * Helper function for processing image
 * @param {String} url image url
 * @returns {String} ascii art
 */
async function genBitMap(url, width, inverted = false) {
  let img = await Jimp.read(url);
  console.log(img.bitmap.width);

  width = Math.min(width, img.bitmap.width);
  img.resize(width, Jimp.AUTO);
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
}

const PORT = process.env.PORT || 3001;
app.use(express.static('public'));
app.listen(PORT);

module.exports = app;
