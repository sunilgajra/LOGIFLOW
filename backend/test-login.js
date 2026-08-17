fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@logiflow.com', password: 'password123' })
}).then(r => r.json()).then(console.log).catch(console.error);
