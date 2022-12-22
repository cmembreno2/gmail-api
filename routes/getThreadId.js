const express = require('express');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

const router = express.Router();

router.get('/threads/:id', async (req,res)=>{

    console.log("Executing Get Thread by Id route...")

    const id = req.params.id;

    try{

        async function loadSavedCredentialsIfExist() {
            try {
              const content = await fs.readFile(TOKEN_PATH);
              const credentials = JSON.parse(content);
              return google.auth.fromJSON(credentials);
            } catch (err) {
              return null;
            }
        }
          
        async function saveCredentials(client) {
            const content = await fs.readFile(CREDENTIALS_PATH);
            const keys = JSON.parse(content);
            const key = keys.installed || keys.web;
            const payload = JSON.stringify({
              type: 'authorized_user',
              client_id: key.client_id,
              client_secret: key.client_secret,
              refresh_token: client.credentials.refresh_token,
            });
            await fs.writeFile(TOKEN_PATH, payload);
        }
          
        async function authorize() {
            let client = await loadSavedCredentialsIfExist();
            if (client) {
              return client;
            }
            client = await authenticate({
              scopes: SCOPES,
              keyfilePath: CREDENTIALS_PATH,
            });
            if (client.credentials) {
              await saveCredentials(client);
            }
            return client;
        }

        async function getThreadId(id) {
            const auth = await authorize()
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