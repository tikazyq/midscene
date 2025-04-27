import { BrowserInterface } from '@/types';
import { PlaywrightBrowser } from './playwright';
import { PuppeteerBrowser } from './puppeteer';

/**
 * Create a browser interface based on the type
 */
export function createBrowser(type: 'playwright' | 'puppeteer'): BrowserInterface {
  switch (type) {
    case 'playwright':
      return new PlaywrightBrowser();
    case 'puppeteer':
      return new PuppeteerBrowser();
    default:
      throw new Error(`Unsupported browser type: ${type}`);
  }
} 