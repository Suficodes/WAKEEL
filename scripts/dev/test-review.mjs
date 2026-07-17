import puppeteer from "puppeteer";

const base = "http://localhost:3000";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${base}/reviews`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));

// count queue rows before
const before = await page.$$eval("main button", (btns) =>
  btns.filter((b) => b.textContent?.includes("%")).length,
);
console.log("queue rows before:", before);

// open the first review row
const rows = await page.$$("main button");
const firstRow = (await Promise.all(
  rows.map(async (r) => ((await (await r.getProperty("textContent")).jsonValue())?.includes("%") ? r : null)),
)).find(Boolean);
await firstRow.click();
await new Promise((r) => setTimeout(r, 600));

// fill reviewer + approve
await page.type('input[placeholder="Your name"]', "Automated QA");
const btns = await page.$$("button");
for (const b of btns) {
  const t = await (await b.getProperty("textContent")).jsonValue();
  if (t?.trim().startsWith("Approve")) {
    await b.click();
    break;
  }
}
await new Promise((r) => setTimeout(r, 1500));

const after = await page.$$eval("main button", (btns) =>
  btns.filter((b) => b.textContent?.includes("%")).length,
);
console.log("queue rows after:", after);
console.log(before > after ? "PASS: item left the queue" : "FAIL: queue unchanged");
await browser.close();
