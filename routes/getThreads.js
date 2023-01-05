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

router.get('/threads', async (req,res)=> {

    console.log("Executing Get Threads...")
    
    const results = [];
    
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
          
        async function listThreads() {
            const auth = await getAuthenticatedClient()
            const gmail = google.gmail({version: 'v1', auth});
            const res = await gmail.users.threads.list({
              userId: 'me',
            });
            const threads = res.data.threads;
            if (!threads || threads.length === 0) {
              console.log('No threads found.');
              return;
            }
            return threads
          }

        listThreads()
        .then(threads=>{
            console.log("Get Threads executed successfully...")
            return res.status(200).json(threads);})
        .catch(console.error);
        
        
    }catch(err){
        console.log(`Error executing Get Threads: ${err}`)
        return res.status(err.code).send(err.message);
    }
});

module.exports = router;