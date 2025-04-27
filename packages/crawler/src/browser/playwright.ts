import { chromium, Browser, Page } from 'playwright';
import { BrowserInterface } from '@/types';

/**
 * Playwright browser implementation
 */
export class PlaywrightBrowser implements BrowserInterface {
  browser!: Browser;
  page!: Page;

  /**
   * Initialize browser and page
   */
  async initialize(options?: { headless?: boolean }): Promise<void> {
    this.browser = await chromium.launch({ 
      headless: options?.headless ?? false 
    });
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    this.page = await context.newPage();
  }

  /**
   * Navigate to a URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Take a screenshot and return the buffer
   */
  async screenshot(): Promise<Buffer> {
    return await this.page.screenshot({ type: 'jpeg', quality: 80 });
  }

  /**
   * Evaluate JavaScript in the page
   */
  async evaluate<T>(fn: string | Function, ...args: any[]): Promise<T> {
    return await this.page.evaluate(fn as any, ...args);
  }

  /**
   * Get page dimensions
   */
  async getPageDimensions(): Promise<{ width: number; height: number }> {
    return await this.page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    }));
  }

  /**
   * Click at coordinates
   */
  async clickAt(x: number, y: number): Promise<void> {
    await this.page.mouse.click(x, y);
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Type text
   */
  async type(text: string): Promise<void> {
    await this.page.keyboard.type(text);
  }

  /**
   * Press key
   */
  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Scroll the page
   */
  async scroll(direction: 'up' | 'down' | 'left' | 'right', distance = 500): Promise<void> {
    const x = direction === 'left' ? -distance : direction === 'right' ? distance : 0;
    const y = direction === 'up' ? -distance : direction === 'down' ? distance : 0;
    await this.page.mouse.wheel(x, y);
  }
} 