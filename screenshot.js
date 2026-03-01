import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log("Navigating to dashboard...");
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait for 3 seconds to ensure charts/data load
        await new Promise(r => setTimeout(r, 3000));

        console.log("Taking screenshot...");
        await page.screenshot({ path: 'dashboard_snapshot.png' });

        await browser.close();
        console.log("Screenshot saved as dashboard_snapshot.png");
    } catch (error) {
        console.error("Failed to take screenshot:", error.message);
        process.exit(1);
    }
})();
