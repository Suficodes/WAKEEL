import puppeteer from "puppeteer";

const url = process.argv[2] || "http://localhost:3000/";
const out = process.argv[3] || "/private/tmp/claude-501/-Users-sufimac-Desktop-WAKEEL/9ba9a290-81c2-4ade-b5f0-75afb83afd89/scratchpad/shot.png";
const theme = process.argv[4] === "dark" ? "dark" : "light";

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((t) => localStorage.setItem("wakeel-theme", t), theme);
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("shot ->", out);
