const http = require('http');

const loginData = JSON.stringify({
  email: 'admin@logiflow.com',
  password: 'password123'
});

const req = http.request('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    const token = data.token;
    
    // Now fetch client
    http.get('http://localhost:5000/api/clients/f6ffb094-539e-4e80-ae66-6b9b7e0351ff', {
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res2) => {
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        console.log("Status:", res2.statusCode);
        console.log("Body:", body2);
      });
    }).on('error', console.error);
  });
});

req.on('error', console.error);
req.write(loginData);
req.end();
