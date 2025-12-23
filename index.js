require('dotenv').config();
const express = require('express');
const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const {
  X_API_KEY,
  X_API_SECRET,
  X_ACCESS_TOKEN,
  X_ACCESS_SECRET
} = process.env;

const oauth = new OAuth({
  consumer: { key: X_API_KEY, secret: X_API_SECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto
      .createHmac('sha1', key)
      .update(baseString)
      .digest('base64');
  }
});

async function postTweet(content) {
  const url = 'https://api.twitter.com/2/tweets';

  const authHeader = oauth.toHeader(
    oauth.authorize(
      { url, method: 'POST' },
      { key: X_ACCESS_TOKEN, secret: X_ACCESS_SECRET }
    )
  );

  const response = await axios.post(
    url,
    { text: content },
    {
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

/* 🔑 Endpoint n8n will call */
app.post('/tweet', async (req, res) => {
  try {
    const { content } = req.body;
    const result = await postTweet(content);
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

