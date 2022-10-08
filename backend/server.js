const fs = require('fs');
const https = require('https');
const url = require('url');
const { parse } = require('querystring');
const secrets = require('../secrets.json');

const options = {
  key: fs.readFileSync('C:/Certbot/archive/api.toolbox-signup.com/privkey2.pem'),
  cert: fs.readFileSync('C:/Certbot/archive/api.toolbox-signup.com/fullchain2.pem'),
};

const server = https.createServer(options, function (request, response) {
  let reqUrl = request.url;
  console.log("REQUESTED => ", reqUrl, request.method);

  switch (request.method) {
    case 'OPTIONS':
      // fucking CORS
      response.writeHead(204, { // 204 = Success, No Content
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Max-Age': '86400'
      });
      response.end();
      break;

    case 'GET':
      const queryObject = url.parse(reqUrl, true).query;
      console.log(queryObject.edit);
      if (!queryObject.edit) {
        response.writeHead(403, { 'Access-Control-Allow-Origin': '*' });
        response.end();
        return;
      }
      // fetch discord message content
      https.get({
        hostname: 'discord.com',
        port: 443,
        path: secrets.hookURL + "/messages/" + queryObject.edit + "?thread_id=" + secrets.threadID,
        method: 'GET',
      }, (resp) => {
        let data = '';
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
          data += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          try {
            if (resp.statusCode !== 200)
              throw `Not OK status ${resp.statusCode}`;
            let teamData = data.match("```(.*)```")[1].replaceAll('\\n', '').replaceAll('\\"', '"');
            response.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
            response.end(teamData);
          }
          catch (err) {
            console.log("Stored Team Parse Error: " + (err.message ? err.message : err));
            response.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
            response.end();
          }
        });
      }).on("error", (err) => {
        console.log("Discord Webhook Error: " + err.message);
        response.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
        response.end();
      });
      break;

    case 'POST':
      // gather data for webhook
      var body = '';
      request.on('data', function (data) {
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
          // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
          request.destroy();
        }
      });
      request.on('end', function () {
        let teamData = JSON.parse(Object.keys(parse(body))[0]);
        // save 'em
        console.log(teamData);
        let editID = teamData.edit;
        delete teamData.edit;
        if (editID)
          DiscordEdit(editID, JSON.stringify(teamData, null, 2), response);
        else
          DiscordPost(JSON.stringify(teamData, null, 2), response);
      });
      break;

    default:
      response.writeHead(400, { 'Access-Control-Allow-Origin': '*' });
      response.end('Request Invalid');
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT);
//the server object listens on port 8080

function DiscordPost(messageBody, response) {
  const data = JSON.stringify({
    content: `\`\`\`${messageBody}\`\`\``,
    username: 'Toolbox Team',
    avatar_url: 'https://tgstation13.org/wiki//images/1/12/BlueToolbox.png'
  })
  const options = {
    hostname: 'discord.com',
    port: 443,
    path: secrets.hookURL + "?wait=true&thread_id=" + secrets.threadID,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
  const push = https.request(options, (resp) => {
    console.log(`statusCode: ${resp.statusCode}`);
    if (resp.statusCode !== 200) {
      response.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
      response.end();
      return;
    }
    let data = '';
    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });
    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      response.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
      response.end(JSON.stringify({ id: JSON.parse(data).id }));
    });
  }).on("error", (err) => {
    console.log("Discord Webhook Error: " + err.message);
    response.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
    response.end();
  });

  push.on('error', error => {
    console.error(error)
  });

  push.write(data);
  push.end();
}

function DiscordEdit(msgID, messageBody, response) {
  const data = JSON.stringify({
    content: `\`\`\`${messageBody}\`\`\``
  })
  const options = {
    hostname: 'discord.com',
    port: 443,
    path: secrets.hookURL + "/messages/" + msgID + "?thread_id=" + secrets.threadID,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
  const push = https.request(options, (resp) => {
    console.log(`statusCode: ${resp.statusCode}`);
    if (resp.statusCode !== 200) {
      response.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
      response.end();
      return;
    }
    response.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
    response.end(JSON.stringify({ id: msgID }));
  }).on("error", (err) => {
    console.log("Error: " + err.message);
    response.writeHead(500, { 'Access-Control-Allow-Origin': '*' });
    response.end();
  });

  push.on('error', error => {
    console.error(error)
  });

  push.write(data);
  push.end();
}
