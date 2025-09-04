import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import { convertImagesToPdf } from './src/helpers/pdfHelper.js';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  
  try {
    const urlFileContent = fs.readFileSync('./links.urls', 'utf-8');
    const urls = urlFileContent.split('\n').filter(url => url.trim() !== '');
    
    if (urls.length === 0) {
      console.warn('No URLs found in links.urls file');
      await browser.close();
      return;
    }
    
    if (!fs.existsSync('./images')) {
      fs.mkdirSync('./images')
    }

    for (const url of urls) {
      if (url.trim()) { // Skip empty lines
        await downloadPdf(url.trim(), browser);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Error: links.urls file not found. Please create a links.urls file with manga URLs.');
    } else {
      console.error('Error reading links.urls file:', error.message);
    }
  } finally {
    await browser.close();
  }
})();

async function downloadPdf(link, browser) {
  try {
    // Validate URL
    let url;
    try {
      url = new URL(link);
    } catch (error) {
      console.error(`Invalid URL: ${link}`);
      return;
    }
    
    const page = await browser.newPage();
    console.info('Opened new page...')

    await page.goto(link);  
    await page.waitForFunction(
      'window.performance.timing.loadEventEnd - window.performance.timing.navigationStart >= 500'
    );
    await page.waitForSelector('#readerarea img.loaded');
    const res = await autoScroll(page);

    const imagesFolder = `./images/${link.split('/')[link.split('/').length - 2]}`
    if (!fs.existsSync(imagesFolder)) fs.mkdirSync(imagesFolder);

    console.info('Start download images...');
    let index = 0;
    for (const imageUrl of res) {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const fileData = Buffer.from(response.data, 'binary');
      fs.writeFileSync(`${imagesFolder}/image-${index}.jpg`, fileData);
      index++;
    }
    console.info(`Downloaded ${index} images, start convert images to pdf...`);
    await convertImagesToPdf(`${imagesFolder}/`, link);
    
    await page.close();
  } catch(e) {
    console.error('Error in downloadPdf:', e.message);
  }
}

async function autoScroll(page){
  return await page.evaluate(async () => {
    return await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        console.log('Sedang sekrol coi');
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if( totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          let res = [];

          const dynamicElements = document.querySelectorAll('#readerarea img.loaded');
          dynamicElements.forEach(element => {
            res.push(element.getAttribute('src'));
          });

          resolve(res);
        }
      }, 10);
    });
  });
}
