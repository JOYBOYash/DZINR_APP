const https = require('https');

const req = https.request('https://api.figma.com/v1/oauth/token', { method: 'POST' }, (res) => {
  console.log("api.figma.com:", res.statusCode);
});
req.end();

const req2 = https.request('https://www.figma.com/api/oauth/token', { method: 'POST' }, (res) => {
  console.log("www.figma.com:", res.statusCode);
});
req2.end();
