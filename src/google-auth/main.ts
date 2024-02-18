import { Actor } from 'apify'
import { OAuth2Client } from "google-auth-library";
import { DEFAULT_TOKENS_STORE } from "./constants.js";
import { liveView, localhost, pleaseOpen } from "./asci-text.js";
import * as http from "http";
import { authorize, close } from "./submit-page.js";
import selectCredentialsAndTokens from "./select-credentials-and-tokens.js";
import { GoogleAuthCredentials } from './types.js';

export async function apifyGoogleAuth({ scope, tokensStore, credentials }: {
    scope: string,
    tokensStore?: string,
    credentials: GoogleAuthCredentials,
}) {
  if (!scope) throw new Error('Missing scope parameter! We don\'t know which service you want to use.');

  if (typeof credentials !== 'object' || !credentials.client_id || !credentials.client_secret || !credentials.redirect_uri) {
    throw new Error('credentials have wrong format. It has to be an object with fields: client_id, client_secret, redirect_uri.');
  }

  const store = await Actor.openKeyValueStore(tokensStore || DEFAULT_TOKENS_STORE);

  const { pickedCredentials, tokens, tokensRecordKey } = await selectCredentialsAndTokens({
    store,
    credentials,
    scope
  });

  const oAuth2Client = new OAuth2Client(
    pickedCredentials.client_id,
    pickedCredentials.client_secret,
    pickedCredentials.redirect_uri,
  );

  if (tokens) {
    console.log('We found tokens saved in our store. No need to authenticate again.');
    oAuth2Client.setCredentials(tokens);
    console.info('using stored tokens');
    return oAuth2Client;
  }

  console.log('We have to authenticate to get the tokens');

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: `https://www.googleapis.com/auth/${scope}`,
  });

  let code: string | null = null;

  const port = Actor.isAtHome() ? process.env.APIFY_CONTAINER_PORT : 3000;
  const information = Actor.isAtHome() ? liveView : localhost;

  console.log(pleaseOpen);
  console.log(information);

  const server = http.createServer((req, res) => {
    // Make sure that no random request (such as favicon) does not override already existing code.
    if (!code) {
      code = new URL(req.url!!, pickedCredentials.redirect_uri).searchParams.get('code');
    }

    if (code) {
      let data = '';
      req.on('data', (body) => {
        if (body) data += body;
      });
      req.on('end', () => {
        res.end(close());
      });
    } else {
      res.end(authorize(authorizeUrl));
    }
  });

  server.listen(port, () => console.log('server is listening on port', port));

  process.on('SIGINT', function () {
    console.log("Caught interrupt signal (Ctrl-C), stopping...");
    process.exit(1);
  });

  const start = Date.now();
  while (!code) {
    const now = Date.now();
    if (now - start > 5 * 60 * 1000) {
      throw new Error('You did not provide the code in time!');
    }
    console.log(`waiting for code...You have ${300 - Math.floor((now - start) / 1000)} seconds left`);

    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  server.close(() => console.log('closing server'));

  // Now that we have the code, use that to acquire tokens.
  const tokensResponse = await oAuth2Client.getToken(code);
  console.log(`Storing the tokens to your store under key ${tokensRecordKey}`);
  await store.setValue(tokensRecordKey, tokensResponse.tokens);
  oAuth2Client.setCredentials(tokensResponse.tokens);
  console.info('returning authenticated client');
  return oAuth2Client;
}
