import puppeteer from 'puppeteer-extra';
import puppeteerCore from 'puppeteer-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { EMAIL } from './email.mjs';
import { USERNAME } from './name.mjs';
import path from 'path';
import clipboardy from 'clipboardy';
import fs from 'fs';

puppeteer.use(StealthPlugin());

global.baseURL = "https://walletapp.waveonsui.com/#tgWebAppData=query_id%3DAAEdKg4NAwAAAB0qDg0IZJIR%26user%3D%257B%2522id%2522%253A6661483037%252C%2522first_name%2522%253A%2522Cia%2522%252C%2522last_name%2522%253A%2522Chi%2522%252C%2522username%2522%253A%2522lusips%2522%252C%2522language_code%2522%253A%2522id%2522%252C%2522allows_write_to_pm%2522%253Atrue%257D%26auth_date%3D1716409754%26hash%3D1ff90c1e56b6c2607c2b22f1ad624566f9d8c8050ba984ca68da2109777378d6&tgWebAppVersion=7.2&tgWebAppPlatform=android&tgWebAppThemeParams=%7B%22bg_color%22%3A%22%23212d3b%22%2C%22section_bg_color%22%3A%22%231d2733%22%2C%22secondary_bg_color%22%3A%22%23151e27%22%2C%22text_color%22%3A%22%23ffffff%22%2C%22hint_color%22%3A%22%237d8b99%22%2C%22link_color%22%3A%22%235eabe1%22%2C%22button_color%22%3A%22%2350a8eb%22%2C%22button_text_color%22%3A%22%23ffffff%22%2C%22header_bg_color%22%3A%22%23242d39%22%2C%22accent_text_color%22%3A%22%2364b5ef%22%2C%22section_header_text_color%22%3A%22%2379c4fc%22%2C%22subtitle_text_color%22%3A%22%237b8790%22%2C%22destructive_text_color%22%3A%22%23ee686f%22%7D";

// utility
const wait = (ms) => {
    return new Promise((res) => setTimeout(res, ms));
};

const logError = (error) => {
    fs.appendFileSync('error.log', `[${new Date().toISOString()}] ${error}\n`);
};

const countdown = (seconds) => {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (seconds <= 0) {
                clearInterval(interval);
                resolve();
            } else {
                process.stdout.write(`Countdown: ${seconds} seconds remaining...\r`);
                seconds--;
            }
        }, 1000);
    });
};

const waitWithCountdown = async (milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000);
    await countdown(seconds);
};

const main = async () => {
    try {
        const pathToExtensionNoCaptcha = path.join(process.cwd(), './noCaptcha');
        const pathToExtensionUBlock = path.join(process.cwd(), './uBlock0.chromium');

        let running = true; // Variable to control the loop

        while (running) {
            for (let i = 0; i < USERNAME.length; i++) {
                let browser, page;
                try {
                    browser = await puppeteerCore.launch({
                        headless: true,
                        executablePath: '/usr/bin/google-chrome', // Adjust this path according to your Chrome installation
                        args: [
                            `--disable-extensions-except=${pathToExtensionNoCaptcha},${pathToExtensionUBlock}`,
                            `--load-extension=${pathToExtensionNoCaptcha}`,
                            `--load-extension=${pathToExtensionUBlock}`,
			    '--no-sandbox'
                        ],
                    });

                    page = await browser.newPage();

                    const client = await page.target().createCDPSession();
                    await page.goto(baseURL);
                    console.log(await page.title());
                    
                    await wait(2 * 1000);
                    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
                    console.log("Halaman diperbarui");
                    await wait(2 * 1000);

                    await page.click('#section-create-account\\ relative > div > div.body_button.absolute.bottom-12 > button.text-white.btn-login');

                    await wait(2 * 1000);
                    const textarea = await page.$('#section-login > div > div:nth-child(4) > label > textarea');

                    if (textarea) {
                        await textarea.type(USERNAME[i]);
                    } else {
                        console.error('Textarea tidak ditemukan.');
                    }

                    await wait(5 * 1000);
                    await page.click('#section-login > div > div.w-full.mt-auto > button');

                    await wait(5 * 1000);
                    await page.click('#section-home > div > div > div.swiper.swiper-initialized.swiper-horizontal.mySwiper > div.swiper-wrapper > div.swiper-slide.swiper-slide-active > div > div.item-1 > div._item-1_2 > div.ml-auto.mt-3 > button > span');

                    await wait(5 * 1000);
                   await page.waitForSelector('#section-transaction > div.block-data.h-full > div > div.overlay.relative > div > div > div > button > div > div');
                   await page.click('#section-transaction > div.block-data.h-full > div > div.overlay.relative > div > div > div > button > div > div');
                   
                    await waitWithCountdown(1 * 60 * 1000);
                    console.log("Time's up!");

                } catch (error) {
                    logError(`Error occurred: ${error}`);
                    if (browser) await browser.close();
                    continue;
                }

                await browser.close();
            }
            
            console.log('Waiting for next iteration...');
            await wait(1 * 60 * 1000); // Menunggu selama 10 menit
        }
    } catch (error) {
        logError(`Unhandled error occurred: ${error}`);
    }
};

main();
