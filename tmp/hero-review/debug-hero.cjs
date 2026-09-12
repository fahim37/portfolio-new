/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { chromium } = require(path.join(process.env.TEMP, 'brightedge-playwright', 'node_modules', 'playwright-core'));
(async () => {
 const browser = await chromium.launch({headless:true, executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('console',m=>console.log(m.type(),m.text()));
 page.on('pageerror',m=>console.log('error',m.message));
 page.on('response',r=>{if(r.url().includes('herovid'))console.log(r.status(),r.url());});
 await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});
 await page.waitForTimeout(3000);
 console.log(await page.evaluate(()=>{const v=document.querySelector('[data-signal-hero] video');return {html:document.querySelector('[data-signal-hero]')?.outerHTML.slice(0,1400),video:v?{src:v.currentSrc,error:v.error?.message,ready:v.readyState,network:v.networkState,duration:v.duration}:null};}));
 await page.screenshot({path:path.join(__dirname,'debug.png')});
 await browser.close();
})();
