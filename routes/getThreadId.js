const express = require('express');
require('dotenv').config();
const {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');
const keys = require('../credentials.json');

const router = express.Router();

router.get('/threads/:id', async (req,res)=>{

    console.log("Executing Get Thread by Id route...")

    const id = req.params.id;

    try{

      async function getAuthenticatedClient() {
        return new Promise((resolve, reject) => {
          const oAuth2Client = new OAuth2Client(
            keys.web.client_id,
            keys.web.client_secret,
            keys.web.redirect_uris[0]
          );
      
          const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/gmail.readonly',
            prompt: 'consent'
          });
      
          const server = http
            .createServer(async (req, res) => {
              try {
                if (req.url.indexOf('/') > -1) {
                  const qs = new url.URL(req.url, 'http://localhost:3000')
                    .searchParams;
                  const code = qs.get('code');
                  console.log(`Code is ${code}`);
                  res.end('Authentication successful! Please return to the console.');
                  server.destroy();
                  const r = await oAuth2Client.getToken(code);
                  oAuth2Client.setCredentials(r.tokens);
                  console.info('Tokens acquired.');
                  resolve(oAuth2Client);
                }
              } catch (e) {
                reject(e);
              }
            })
            .listen(3000, () => {
              open(authorizeUrl, {wait: false}).then(cp => cp.unref());
            });
          destroyer(server);
        });
      }

        async function getThreadId(id) {
            const auth = await getAuthenticatedClient()
            const gmail = google.gmail({version: 'v1', auth});
            const res = await gmail.users.threads.get({
              id: id,
              userId: 'me',
            });
            const thread = res.data;
            if (!thread || thread.length === 0) {
              console.log('No threads found.');
              return;
            }
            let rawConversation = thread.messages
            let conversation = []
            rawConversation.forEach((rawMessage)=>{
              const header = rawMessage.payload.headers
              var date = header.filter(obj => {
                return obj.name === 'Date'
              })
              var from = header.filter(obj => {
                return obj.name === 'From'
              })
              var to = header.filter(obj => {
                return obj.name === 'To'
              })
              var message = {
                to : to[0].value,
                from : from[0].value,
                date : date[0].value,
                message : rawMessage.snippet
              }
              conversation.push(message)
            })
            return conversation
        }

        getThreadId(id)
        .then(conversation=>{
            console.log("Get Thread by Id executed successfully...")
            return res.status(200).json(conversation);

        })
        .catch(console.error);

    }catch(err){
        console.log(`Error executing Thread by Id: ${err}`);
        return res.status(err.code).send(err.message);
    }
});

module.exports = router;