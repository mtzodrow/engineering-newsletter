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
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .newsletter-item { margin-bottom: 40px; border-bottom: 2px solid #ccc; padding-bottom: 40px; }
        .newsletter-item h2 { color: #333; }
        .newsletter-item .date { color: #666; font-size: 14px; }
        .newsletter-content img { max-width: 100% !important; height: auto !important; }
        .newsletter-content a.mcnButton {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
        }
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

        // Extract inline styles from the original page
        let styles = '';
        $('style').each(function () {
          styles += $(this).html();
        });

        // Only grab the email content container
        const emailContent = $('#templateBody').html()
          || $('#bodyContent').html()
          || $('#templateContainer').html()
          || $('.templateContainer').html()
          || $('table.body').html();

        if (emailContent) {
          content = '<style>' + styles + '</style>' + emailContent;
        } else {
          // Fallback: grab body but strip known Mailchimp UI
          $('script, noscript').remove();
          $('[id*="awesomewrap"]').remove();
          $('[id*="archive"]').remove();
          $('[class*="archive"]').remove();
          $('[id*="translate"]').remove();
          $('[class*="translate"]').remove();
          $('[id*="banner"]').remove();
          $('[class*="banner"]').remove();
          content = '<style>' + styles + '</style>' + $('body').html();
        }

      } catch (err) {
        content = '<p>Unable to load content. <a href="' + item.link + '">View online</a></p>';
      }

      const date = new Date(item.pubDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      html += `
        <div class="newsletter-item">
          <h2>${item.title}</h2>
          <p class="date">${date}</p>
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
