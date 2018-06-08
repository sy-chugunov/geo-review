var assert = require('assert'),
    http = require('http'),
    storage = {},
    server = http.createServer(function(request, response) {
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Access-Control-Allow-Origin', '*');

        parsePost(request).then(function(post) {
            var parsed = JSON.parse(post);

            assert.equal(typeof parsed.op, 'string');

            switch (parsed.op.toLowerCase()) {
                case 'add':
                    assert.notStrictEqual(parsed.review.coords, undefined);
                    assert.notStrictEqual(parsed.review.coords.x, undefined);
                    assert.notStrictEqual(parsed.review.coords.y, undefined);
                    assert.equal(parsed.review.coords.x > 0, true);
                    assert.equal(parsed.review.coords.y > 0, true);

                    assert.equal(typeof parsed.review.address, 'string');
                    assert.equal(parsed.review.address.trim().length > 0, true);

                    assert.equal(typeof parsed.review.name, 'string');
                    assert.equal(parsed.review.name.trim().length > 0, true);

                    assert.equal(typeof parsed.review.place, 'string');
                    assert.equal(parsed.review.place.trim().length > 0, true);

                    assert.equal(typeof parsed.review.text, 'string');
                    assert.equal(parsed.review.text.trim().length > 0, true);

                    var date = new Date();

                    parsed.review.date = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());

                    if (!storage[parsed.review.address]) {
                        storage[parsed.review.address] = [];
                    }

                    storage[parsed.review.address].push(parsed.review);

                    console.log('A new review was added: [%s] - %s', parsed.review.address, parsed.review.place);

                    return storage[parsed.review.address];
                case 'get':
                    assert.equal(typeof parsed.address, 'string');
                    assert.equal(parsed.address.trim().length > 0, true);

                    return storage[parsed.address] || [];
                case 'all':
                    return storage;
            }
        }).then(function(result) {
            response.writeHead(200);
            response.write(JSON.stringify(result));
            response.end();
        }).catch(function(e) {
            response.writeHead(403);
            response.write(JSON.stringify({
                error: {message: 'Wrong format'}
            }));
            response.end();
        });
    });

server.listen(3000, 'localhost', () => console.log("Server listening 'localhost:3000'"));

function parsePost(req) {
    return new Promise(function(resolve) {
        var data = '';

        if (req.method.toLowerCase() !== 'post') {
            throw new Error('Method is not POST');
        }

        req.on('data', function(chunk) {
            data += chunk;
        });
        req.on('end', function() {
            resolve(data);
        });
    });
}
