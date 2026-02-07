const http = require('http');

const data = JSON.stringify({
  code: '399799',
  cpf: '111.710.776-02',
  password: 'password123',
  email: 'rafaelreisssilva034@gmail.com'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/affiliates/activate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
        const parsed = JSON.parse(responseData);
        console.log('Status:', res.statusCode);
        if (parsed.debug) {
            console.log('--- DEBUG LOGS ---');
            parsed.debug.forEach(log => {
                console.log(log.msg, log.data ? JSON.stringify(log.data, null, 2) : '');
            });
            console.log('------------------');
        } else {
            console.log('Response:', JSON.stringify(parsed, null, 2));
        }
    } catch (e) {
        console.log('Response (Raw):', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
