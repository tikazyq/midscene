import { Browser, Page } from 'playwright';
import { KeyInput } from 'puppeteer';

/**
 * Crawler generator options
 */
export interface CrawlerGeneratorOptions {
  /**
   * Output directory for generated crawler code, screenshots, and logs
   */
  outputDir?: string;
  
  /**
   * Whether to take screenshots and visualize operations
   */
  visualize?: boolean;
  
  /**
   * Browser to use (playwright or puppeteer)
   */
  browser?: 'playwright' | 'puppeteer';
  
  /**
   * Whether to run in headless mode
   */
  headless?: boolean;
  
  /**
   * Whether to generate crawler code
   */
  generateCode?: boolean;
  
  /**
   * Maximum number of pages to crawl
   */
  maxPages?: number;
}

/**
 * Instruction step for generating a crawler
 */
export interface InstructionStep {
  /**
   * Type of instruction (action or extraction)
   */
  type?: 'action' | 'extract';
  
  /**
   * Action to perform (e.g. "click on the login button")
   */
  action?: string;
  
  /**
   * Extraction query (string or object structure)
   */
  query?: string | Record<string, any>;
  
  /**
   * Optional delay after executing this step (in ms)
   */
  delay?: number;
}

/**
 * Result of plan execution
 */
export interface PlanExecutionResult {
  /**
   * The result of the plan
   */
  planResult: any;
  
  /**
   * Path to the screenshot taken before execution
   */
  beforeScreenshot: string | null;
  
  /**
   * Path to the screenshot taken after execution
   */
  afterScreenshot: string | null;
  
  /**
   * URL after execution
   */
  url: string;
}

/**
 * Site pattern learned during crawling
 */
export interface SitePattern {
  /**
   * Instructions that were executed on this site
   */
  instructions: string[];
  
  /**
   * Plans that were executed
   */
  plans: any[];
  
  /**
   * Element detections performed
   */
  elementDetections?: Array<{
    description: string;
    element: {
      selector: string;
      text?: string;
      tagName?: string;
      attributes?: Record<string, string>;
    };
    url: string;
    success: boolean;
  }>;
  
  /**
   * Extraction pattern used
   */
  extractionPattern?: any;
  
  /**
   * Extraction result
   */
  extractionResult?: any;
}

/**
 * Summary of a crawling session step
 */
export interface CrawlingSessionStep {
  /**
   * Type of step
   */
  type: 'action' | 'extract';
  
  /**
   * Instruction that was executed
   */
  instruction: string;
  
  /**
   * Query that was used (for extraction steps)
   */
  query?: any;
  
  /**
   * Result of the extraction
   */
  result?: any;
  
  /**
   * Result of the plan (for action steps)
   */
  planResult?: any;
  
  /**
   * Path to the screenshot taken before execution
   */
  beforeScreenshot?: string | null;
  
  /**
   * Path to the screenshot taken after execution
   */
  afterScreenshot?: string | null;
}

/**
 * Summary of a crawling session
 */
export interface CrawlingSessionSummary {
  /**
   * ISO string timestamp when the session started
   */
  startTime: string;
  
  /**
   * ISO string timestamp when the session ended
   */
  endTime: string;
  
  /**
   * Starting URL
   */
  startUrl: string;
  
  /**
   * Steps executed during the session
   */
  steps: CrawlingSessionStep[];
  
  /**
   * URLs visited during the session
   */
  visitedUrls: string[];
  
  /**
   * Path to the generated crawler code
   */
  generatedCrawler?: string | null;
}

/**
 * Result of crawler generation
 */
export interface CrawlerGenerationResult {
  /**
   * Summary of the crawling session
   */
  sessionSummary: CrawlingSessionSummary;
  
  /**
   * Path to the generated crawler code
   */
  crawlerCodePath: string | null;
  
  /**
   * Path to the session log
   */
  sessionLogPath: string;
}

/**
 * Browser interface to abstract between Puppeteer and Playwright
 */
export interface BrowserInterface {
  /** The page object */
  page: Page | any;
  /** The browser instance */
  browser: Browser | any;
  /** Initialize browser and page */
  initialize(options?: { headless?: boolean }): Promise<void>;
  /** Navigate to a URL */
  goto(url: string): Promise<void>;
  /** Close the browser */
  close(): Promise<void>;
  /** Take a screenshot and return the buffer */
  screenshot(): Promise<Buffer>;
  /** Evaluate JavaScript in the page */
  evaluate<T>(fn: string | Function, ...args: any[]): Promise<T>;
  /** Get page dimensions */
  getPageDimensions(): Promise<{ width: number; height: number }>;
  /** Click at coordinates */
  clickAt(x: number, y: number): Promise<void>;
  /** Type text */
  type(text: string): Promise<void>;
  /** Press key */
  press(key: KeyInput): Promise<void>;
  /** Scroll the page */
  scroll(direction: 'up' | 'down' | 'left' | 'right', distance?: number): Promise<void>;
} 