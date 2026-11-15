import type { Child, Parent, Routine } from "./db/schema";
import { env } from "./env";
import { formatLongDate } from "./time";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function layout(body: string, preheader = "") {
  const logo = `${env.APP_URL.replace(/\/$/, "")}/brand/clock-180.png`;
  return `<!doctype html><html><body style="margin:0;background:#F6F3EC;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#161616">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F6F3EC"><tr><td align="center" style="padding:28px 16px">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#F6F3EC;border:1.5px solid #161616">
<tr><td align="center" style="padding:24px 24px 4px">
<div style="font-size:11px;letter-spacing:4px;text-transform:lowercase">15 mins / day</div>
<img src="${logo}" width="64" alt="" style="display:block;margin:12px auto 4px">
<div style="font-family:'Grand Hotel',Georgia,cursive;font-size:30px;transform:rotate(-4deg)">The Reading Routine</div>
</td></tr>
<tr><td style="padding:12px 28px 28px;font-size:15px;line-height:1.55">${body}</td></tr>
</table>
<p style="font-size:11px;color:#5b5b5b;max-width:520px">You're receiving this because you signed up for The Reading Routine. <a href="${env.APP_URL}/account" style="color:#5b5b5b">Change delivery time, pause or cancel</a>.</p>
</td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#161616;color:#F6F3EC;text-decoration:none;padding:12px 20px;font-weight:700">${esc(label)}</a>`;
const smallButton = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;border:1.5px solid #161616;color:#161616;text-decoration:none;padding:8px 12px;margin:3px;font-size:13px">${esc(label)}</a>`;

export function routineEmail(opts: {
  parent: Parent;
  child: Child;
  routine: Routine;
  links: { pdf: string; screen: string; feedback: (v: "too_hard" | "just_right" | "too_easy") => string; check: string };
}) {
  const { child, routine, links } = opts;
  const name = esc(child.firstName);
  const words = routine.sparkWords.map((w) => w.word);
  const chapter = routine.mode === "chapter";
  const subject = chapter
    ? `${child.firstName}'s chapter for tonight: ${routine.story?.title ?? ""}`
    : `Tonight's Reading Routine for ${child.firstName}`;
  const html = layout(
    `<p>Tonight's routine for ${name} is ready (${esc(formatLongDate(routine.forDate))}). It's attached as a PDF you can print or flip through on your phone or tablet.</p>
<p style="text-align:center;margin:22px 0 8px">${button(links.pdf, "Print tonight's routine")}</p>
<p style="text-align:center;margin:0 0 22px;font-size:14px"><a href="${links.screen}">Reading from a phone or tablet tonight? Open this version</a></p>
${chapter ? "" : `<p style="font-size:14px;background:#fffdf8;border:1px solid #161616;padding:10px 12px"><strong>Making the little book:</strong> print page 1 single-sided. Fold it in half the long way and open it. Fold it in half the short way, then in half again, and open it. Fold it in half the short way and cut along the dashed line, from the fold to where the creases cross. Open it, fold it the long way, push the ends together so the middle opens, and fold the pages into a book with the cover on the front.</p>`}
<p><strong>Tonight's Spark Words:</strong> ${words.map((w) => `<em>${esc(w)}</em>`).join(", ")}</p>
${chapter ? `<p>${name} reads tonight's chapter to you: <em>${esc(routine.story?.title ?? "")}</em>.</p>` : `<p><strong>Bedtime story:</strong> <em>${esc(routine.story?.title ?? "")}</em></p>`}
${routine.includesCheck ? `<p><strong>It's check night!</strong> There's a short word check in the PDF. <a href="${links.check}">Record the result here</a> when you're done.</p>` : ""}
<hr style="border:none;border-top:1px solid #161616;margin:22px 0">
<p style="text-align:center;margin-bottom:6px">After reading, how was it for ${name}?</p>
<p style="text-align:center;margin:0">${smallButton(links.feedback("too_hard"), "Too hard")}${smallButton(links.feedback("just_right"), "Just right")}${smallButton(links.feedback("too_easy"), "Too easy")}</p>`,
    `Spark Words: ${words.join(", ")}`,
  );
  const text = `Tonight's routine for ${child.firstName} is attached. Print it: ${links.pdf}\nOr read it on a phone or tablet: ${links.screen}
Spark Words: ${words.join(", ")}
${routine.includesCheck ? `Check night! Record the result: ${links.check}\n` : ""}
How was it? Too hard: ${links.feedback("too_hard")}
Just right: ${links.feedback("just_right")}
Too easy: ${links.feedback("too_easy")}`;
  return { subject, html, text };
}

export function loginEmail(link: string) {
  return {
    subject: "Your sign-in link for The Reading Routine",
    html: layout(
      `<p>Here's your sign-in link. It works once and expires in 30 minutes.</p><p style="text-align:center;margin:22px 0">${button(link, "Sign in")}</p><p style="font-size:13px;color:#5b5b5b">If you didn't ask for this, you can ignore this email.</p>`,
    ),
    text: `Sign in to The Reading Routine: ${link}\nThis link works once and expires in 30 minutes.`,
  };
}

export function welcomeEmail(opts: { childNames: string[]; deliveryTime: string; trialEnds: Date | null; accountLink: string }) {
  const kids = opts.childNames.map(esc).join(" and ");
  return {
    subject: `Welcome to The Reading Routine`,
    html: layout(
      `<p>Welcome! ${kids}'s first routine arrives today at ${esc(opts.deliveryTime)}, and every day after that.</p>
<p><strong>How it works:</strong> your child reads a short book to you, you meet three Spark Words together, then you read a bedtime story made just for them. About 15 minutes, start to finish.</p>
<p>Everything in The Reading Routine was designed by a mom and classroom teacher with 20 years of experience and a Master of Education in literacy, so you can relax and simply enjoy reading together. No teaching background needed.</p>
${opts.trialEnds ? `<p>Your free trial runs until ${esc(opts.trialEnds.toLocaleDateString("en-CA", { month: "long", day: "numeric" }))}.</p>` : ""}
<p style="text-align:center;margin:22px 0">${button(opts.accountLink, "Your account")}</p>`,
    ),
    text: `Welcome! ${opts.childNames.join(" and ")}'s first routine arrives today at ${opts.deliveryTime}. Your account: ${opts.accountLink}`,
  };
}
