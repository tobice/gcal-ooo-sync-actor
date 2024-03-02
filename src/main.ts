import { runActor } from './runActor.js';
import { Actor } from 'apify';

await runActor();
await Actor.exit(); // Call it here not to kill integration tests
