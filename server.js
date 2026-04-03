const express = require('express');
const app = express();
const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const parser = new Parser();

app.get('/', async (req, res) => {
  try {
    const feedUrl = 'https://us12.campaign-archive.com/feed?u=c9cf3b120a074246030a6f683&id=5b2b2c14d8';
    const feed = await parser.parseURL(feedUrl);

    // Just grab the first newsletter
    const item = feed.items[0];
    const response = await axios.get(item.link, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);

    // List all top-level IDs and classes so we can find the right containers
    let debug = '<h2>Debug: Top-level element IDs and classes</h2><ul>';
    $('body > *').each(function () {
      const id = $(this).attr('id') || 'no-id';
      const cls = $(this).attr('class') || 'no-class';
      const tag = $(this).prop('tagName');
      debug += `<li><strong>${tag}</strong> | id="${id}" | class="${cls}"</li>`;
    });
    debug += '</ul>';

    // Also list all elements with IDs
    debug += '<h2>All elements with IDs</h2><ul>';
    $('[id]').each(function () {
      const id = $(this).attr('id');
      const tag = $(this).prop('tagName');
      debug += `<li><strong>${tag}</strong> | id="${id}"</li>`;
    });
    debug += '</ul>';

    res.send(debug);
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on port ' + port));
