const express = require('express');
const app = express();
const axios = require('axios');

app.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://mailchi.mp/ff8cf5444e6f/eg-news-machine-shop-updates-volunteer-recognition-upcoming-events-18018250', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      maxRedirects: 5
    });

    // Show the raw HTML as text so we can see the structure
    res.set('Content-Type', 'text/plain');
    res.send(response.data);
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on port ' + port));
