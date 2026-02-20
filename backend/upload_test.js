import fs from 'fs';
import http from 'http';

const fileBuffer = fs.readFileSync('../real_test.pdf');
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const postData = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n'),
    fileBuffer,
    Buffer.from('\r\n--' + boundary + '--\r\n')
]);

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': postData.length
    }
}, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.write(postData);
req.end();
