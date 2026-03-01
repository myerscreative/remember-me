const http = require('http');
http.createServer((req, res) => res.end('ok')).listen(3000, () => console.log('Listening on 3000'));
