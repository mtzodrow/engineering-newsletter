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

    let html = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0 auto; padding: 20px; background: #f4f4f4; }
        .newsletter-item { margin-bottom: 60px; border-bottom: 3px solid #ccc; padding-bottom: 60px; }
        .newsletter-title { color: #333; text-align: center; font-size: 24px; }
        .newsletter-date { color: #666; font-size: 14px; text-align: center; margin-bottom: 20px; }
        .newsletter-content img { max-width: 100% !important; height: auto !important; }
        .newsletter-content { max-width: 800px; margin: 0 auto; }
      </style>
    </head>
    <body>`;

    const max = 10;
    const items = feed.items.slice(0, max);

    for (const item of items) {
      let content = '';
      try {
        const response = await axios.get(item.link, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          maxRedirects: 5
        });

        const $ = cheerio.load(response.data);

        // Collect all original styles
        let styles = '';
        $('style').each(function () {
          styles += $(this).html();
        });

        // Remove unwanted Mailchimp chrome
        $('#awesomewrap').remove();
        $('script').remove();
        $('noscript').remove();
        $('meta').remove();
        $('link').remove();
        $('title').remove();

        // Try to find the main content table
        let emailContent = '';
        
        // Look for the main body table
        const bodyTable = $('#bodyTable').html();
        if (bodyTable) {
          emailContent = bodyTable;
        } else {
          // Fallback: get everything inside body
          emailContent = $('body').html();
        }

        content = '<style>' + styles + '</style>' + emailContent;

      } catch (err) {
        content = '<p>Unable to load content. <a href="' + item.link + '">View online</a></p>';
      }

      const date = new Date(item.pubDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      html += `
        <div class="newsletter-item">
          <h2 class="newsletter-title">${item.title}</h2>
          <p class="newsletter-date">${date}</p>
          <div class="newsletter-content">${content}</div>
        </div>`;
    }

    html += '</body></html>';
    res.send(html);
  } catch (err) {
    res.send('Unable to load newsletter feed.');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on port ' + port));
