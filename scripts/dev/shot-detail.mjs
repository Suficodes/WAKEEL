import puppeteer from "puppeteer";

const out = process.argv[2] || "/tmp/detail.png";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
await page.goto("http://localhost:3000/registry", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));
// click the first agent row
const row = await page.$("tbody tr");
await row.click();
await new Promise((r) => setTimeout(r, 1400)); // let the orb float/pulse settle mid-cycle
await page.screenshot({ path: out });
await browser.close();
console.log("detail ->", out);
