import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { env } from "./env";

export type Attachment = { filename: string; contentType: string; content: Buffer };
export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
};

let ses: SESv2Client | null = null;

function wrap76(b64: string) {
  return b64.replace(/.{1,76}/g, (m) => m + "\r\n");
}

/** Builds a multipart MIME message (needed for the PDF attachment). */
export function buildMime(email: Email, from: string): string {
  const mixed = `mixed_${Math.random().toString(36).slice(2)}`;
  const alt = `alt_${Math.random().toString(36).slice(2)}`;
  const enc = (s: string) => `=?UTF-8?B?${Buffer.from(s).toString("base64")}?=`;
  const lines = [
    `From: ${from}`,
    `To: ${email.to}`,
    `Subject: ${enc(email.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    "",
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    "",
    `--${alt}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(Buffer.from(email.text).toString("base64")),
    `--${alt}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(Buffer.from(email.html).toString("base64")),
    `--${alt}--`,
  ];
  for (const a of email.attachments ?? []) {
    lines.push(
      `--${mixed}`,
      `Content-Type: ${a.contentType}; name="${a.filename}"`,
      `Content-Disposition: attachment; filename="${a.filename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      wrap76(a.content.toString("base64")),
    );
  }
  lines.push(`--${mixed}--`, "");
  return lines.join("\r\n");
}

export async function sendEmail(email: Email): Promise<void> {
  if (env.EMAIL_TRANSPORT === "outbox") {
    // Local development: write the email to ./.outbox so it can be opened in a browser.
    const dir = path.join(process.cwd(), ".outbox");
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const base = path.join(dir, `${stamp}-${email.to.replace(/[^a-z0-9]/gi, "_")}`);
    await writeFile(`${base}.html`, `<!-- To: ${email.to} | Subject: ${email.subject} -->\n${email.html}`);
    for (const a of email.attachments ?? []) await writeFile(`${base}-${a.filename}`, a.content);
    console.log(`[outbox] ${email.subject} → ${email.to} (${base}.html)`);
    return;
  }
  ses ??= new SESv2Client({ region: env.AWS_REGION });
  const raw = buildMime(email, env.EMAIL_FROM);
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: env.EMAIL_FROM,
      Destination: { ToAddresses: [email.to] },
      Content: { Raw: { Data: Buffer.from(raw) } },
    }),
  );
}
