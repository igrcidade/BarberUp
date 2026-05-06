import http from 'http';

const data = JSON.stringify({
  userId: "123",
  email: "test@test.com",
  adminEmail: "igor.cidade@hotmail.com"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/delete-user',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let chunks = '';
  res.on('data', d => chunks += d);
  res.on('end', () => console.log('Response:', chunks));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
