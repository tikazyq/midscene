import { BrowserInterface } from '@/types';
import { createBrowser } from '@/browser';
import { KeyInput } from 'puppeteer';

/**
 * Options for the CrawlerAgent
 */
export interface CrawlerAgentOptions {
  /**
   * Browser to use for crawling
   */
  browser?: 'playwright' | 'puppeteer';
  
  /**
   * Whether to run in headless mode
   */
  headless?: boolean;
  
  /**
   * Timeout for navigation operations in milliseconds
   */
  timeout?: number;
  
  /**
   * User agent string to use
   */
  userAgent?: string;
}

/**
 * Action result from the agent
 */
export interface AgentActionResult {
  /**
   * Whether the action was successful
   */
  success: boolean;
  
  /**
   * Optional error message if the action failed
   */
  error?: string;
  
  /**
   * Optional data returned from the action
   */
  data?: any;
}

/**
 * Position coordinate for browser interactions
 */
interface Position {
  x: number;
  y: number;
}

/**
 * CrawlerAgent class for automating web interactions
 */
export class CrawlerAgent {
  private browser: BrowserInterface;
  private options: CrawlerAgentOptions;
  private isInitialized = false;
  
  /**
   * Create a new CrawlerAgent
   */
  constructor(options: CrawlerAgentOptions = {}) {
    this.options = {
      browser: options.browser || 'playwright',
      headless: options.headless ?? false,
      timeout: options.timeout || 30000,
      userAgent: options.userAgent
    };
    
    this.browser = createBrowser(this.options.browser || 'playwright');
  }
  
  /**
   * Initialize the agent and browser
   */
  async initialize(): Promise<AgentActionResult> {
    try {
      await this.browser.initialize({
        headless: this.options.headless
      });
      
      // Set user agent if provided
      if (this.options.userAgent && 'page' in this.browser) {
        await this.browser.evaluate(`() => {
          Object.defineProperty(navigator, 'userAgent', {
            get: () => '${this.options.userAgent}'
          });
        }`);
      }
      
      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Navigate to a URL
   */
  async navigateTo(url: string): Promise<AgentActionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Browser not initialized' };
    }
    
    try {
      await this.browser.goto(url);
      return {
        success: true,
        data: { url: await this.getCurrentUrl() }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to navigate to ${url}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Get the current page URL
   */
  async getCurrentUrl(): Promise<string> {
    return await this.browser.evaluate('() => window.location.href');
  }
  
  /**
   * Get the page title
   */
  async getPageTitle(): Promise<string> {
    return await this.browser.evaluate('() => document.title');
  }
  
  /**
   * Click on an element matching the selector
   */
  async clickElement(selector: string): Promise<AgentActionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Browser not initialized' };
    }
    
    try {
      const elementExists = await this.browser.evaluate(`(selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        
        // Scroll element into view
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        
        return true;
      }`, selector);
      
      if (!elementExists) {
        return {
          success: false,
          error: `Element with selector "${selector}" not found`
        };
      }
      
      // Get element position
      const position = await this.browser.evaluate<Position | null>(`(selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }`, selector);
      
      if (!position) {
        return {
          success: false,
          error: `Could not determine position of element with selector "${selector}"`
        };
      }
      
      // Click at the element's position
      await this.browser.clickAt(position.x, position.y);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to click element with selector "${selector}": ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Type text into the active element or element matching selector
   */
  async typeText(text: string, selector?: string): Promise<AgentActionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Browser not initialized' };
    }
    
    try {
      if (selector) {
        // Focus the element first
        const elementExists = await this.browser.evaluate(`(selector) => {
          const element = document.querySelector(selector);
          if (!element) return false;
          element.focus();
          return true;
        }`, selector);
        
        if (!elementExists) {
          return {
            success: false,
            error: `Element with selector "${selector}" not found`
          };
        }
      }
      
      await this.browser.type(text);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to type text: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Press a key
   */
  async pressKey(key: KeyInput): Promise<AgentActionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Browser not initialized' };
    }
    
    try {
      await this.browser.press(key);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to press key "${key}": ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Scroll the page
   */
  async scroll(direction: 'up' | 'down' | 'left' | 'right', distance?: number): Promise<AgentActionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Browser not initialized' };
    }
    
    try {
      await this.browser.scroll(direction, distance);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to scroll ${direction}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Extract text content from elements matching a selector
   */
  async extractText(selector: string): Promise<AgentActionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Browser not initialized' };
    }
    
    try {
      const texts = await this.browser.evaluate<string[]>(`(selector) => {
        const elements = Array.from(document.querySelectorAll(selector));
        return elements.map(el => el.textContent?.trim()).filter(Boolean);
      }`, selector);
      
      return {
        success: true,
        data: { texts }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to extract text from "${selector}": ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Extract structured data from the page
   */
  async extractData(extractionSpec: Record<string, string>): Promise<AgentActionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Browser not initialized' };
    }
    
    try {
      const result = await this.browser.evaluate<Record<string, string | string[] | null>>(`(spec) => {
        const result = {};
        
        for (const [key, selector] of Object.entries(spec)) {
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) {
            result[key] = null;
          } else if (elements.length === 1) {
            result[key] = elements[0].textContent?.trim() || null;
          } else {
            result[key] = Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
          }
        }
        
        return result;
      }`, extractionSpec);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to extract data: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Take a screenshot of the current page
   */
  async takeScreenshot(): Promise<AgentActionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Browser not initialized' };
    }
    
    try {
      const screenshot = await this.browser.screenshot();
      return {
        success: true,
        data: { screenshot }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to take screenshot: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(timeout?: number): Promise<AgentActionResult> {
    if (!this.isInitialized) {
      return { success: false, error: 'Browser not initialized' };
    }
    
    try {
      // Implementation depends on browser type
      await this.browser.evaluate<boolean>(`(timeout) => {
        return new Promise((resolve) => {
          let resolved = false;
          
          // Resolve when the page is considered loaded
          const checkReadyState = () => {
            if (document.readyState === 'complete' && !resolved) {
              resolved = true;
              resolve(true);
            }
          };
          
          // Check initial state
          checkReadyState();
          
          // Set up listeners
          document.addEventListener('readystatechange', checkReadyState);
          
          // Set timeout
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve(false);
            }
          }, timeout || 30000);
        });
      }`, timeout || this.options.timeout);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to wait for navigation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Close the browser and cleanup
   */
  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.browser.close();
      this.isInitialized = false;
    }
  }
} 