import puppeteer from "puppeteer";

// Curated viewport (above-the-fold) shots for the README.
const OUT = "docs/screenshots";
const W = 1440;
const H = 900;

const shots = [
  { name: "overview-dark", url: "/", theme: "dark" },
  { name: "overview-light", url: "/", theme: "light" },
  { name: "registry", url: "/registry", theme: "dark" },
  { name: "reviews", url: "/reviews", theme: "light" },
  { name: "incidents", url: "/incidents", theme: "dark" },
  { name: "reports", url: "/reports", theme: "light" },
  { name: "agent-detail", url: "/registry", theme: "light", openRow: true },
];

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
for (const s of shots) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument((t) => localStorage.setItem("wakeel-theme", t), s.theme);
  await page.goto(`http://localhost:3000${s.url}`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  if (s.openRow) {
    const row = await page.$("tbody tr");
    if (row) await row.click();
    await new Promise((r) => setTimeout(r, 1400));
  }
  await page.screenshot({ path: `${OUT}/${s.name}.png` }); // viewport only
  await page.close();
  console.log("shot ->", s.name);
}
await browser.close();
