/**
 * Runs the scheduler once, as the cron would: sends today's routine to every
 * child whose parent's delivery time has passed and who hasn't had it yet.
 *   npm run dispatch
 */
import "dotenv/config";
import { dispatchDue } from "../src/lib/routine";

dispatchDue()
  .then((r) => {
    console.log(`Sent ${r.filter((x) => x.ok).length}, failed ${r.filter((x) => !x.ok).length}.`);
    for (const f of r.filter((x) => !x.ok)) console.log(f);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
