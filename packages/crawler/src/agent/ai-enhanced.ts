import { CrawlerAgent, CrawlerAgentOptions, AgentActionResult } from '../agent';
import fs from 'fs-extra';
import path from 'path';
import { BrowserInterface } from '@/types';

// Import directly from @midscene/core
import * as midsceneCore from '@midscene/core';

// Simple debug function
const debug = (message: string, ...args: any[]) => {
  console.log(`[crawler:ai-agent] ${message}`, ...args);
};

/**
 * AI-enhanced crawler agent options
 */
export interface AIEnhancedAgentOptions extends CrawlerAgentOptions {
  /**
   * Output directory for logs, screenshots and extracted data
   */
  outputDir?: string;
  
  /**
   * Optional API key for AI services
   */
  aiApiKey?: string;
  
  /**
   * AI model to use for visual understanding
   */
  visualModel?: 'basic' | 'advanced' | 'custom';
  
  /**
   * AI model to use for planning and decision making
   */
  planningModel?: 'basic' | 'advanced' | 'custom';
  
  /**
   * Whether to use visual understanding capabilities
   */
  useVisualUnderstanding?: boolean;
  
  /**
   * Whether to use autonomous planning capabilities
   */
  useAutonomousPlanning?: boolean;
  
  /**
   * Confidence threshold for AI-based decisions (0.0 to 1.0)
   */
  confidenceThreshold?: number;
  
  /**
   * Maximum number of retry attempts for AI operations
   */
  maxRetries?: number;
}

/**
 * AI-enhanced crawler agent with visual understanding and planning capabilities
 * Leverages @midscene/core for AI planning and element location
 */
export class AIEnhancedAgent extends CrawlerAgent {
  private aiOptions: AIEnhancedAgentOptions;
  private screenshotCounter = 0;
  
  /**
   * Create a new AI-enhanced crawler agent
   */
  constructor(options: AIEnhancedAgentOptions = {}) {
    super({
      browser: options.browser,
      headless: options.headless,
      timeout: options.timeout,
      userAgent: options.userAgent
    });
    
    this.aiOptions = {
      outputDir: options.outputDir || './crawler-ai-output',
      aiApiKey: options.aiApiKey,
      visualModel: options.visualModel || 'basic',
      planningModel: options.planningModel || 'basic',
      useVisualUnderstanding: options.useVisualUnderstanding ?? true,
      useAutonomousPlanning: options.useAutonomousPlanning ?? true,
      confidenceThreshold: options.confidenceThreshold || 0.7,
      maxRetries: options.maxRetries || 3,
      ...options
    };
    
    // Ensure output directory exists
    if (this.aiOptions.outputDir) {
      this.ensureOutputDirectory();
    }
  }
  
  /**
   * Ensure the output directory exists
   */
  private ensureOutputDirectory(): void {
    try {
      if (!fs.existsSync(this.aiOptions.outputDir!)) {
        fs.mkdirSync(this.aiOptions.outputDir!, { recursive: true });
      }
    } catch (error) {
      debug(`Failed to create output directory: ${error}`);
    }
  }
  
  /**
   * Initialize the agent with AI capabilities
   */
  async initialize(): Promise<AgentActionResult> {
    const result = await super.initialize();
    if (!result.success) {
      return result;
    }
    
    // Reset AI-specific state
    this.screenshotCounter = 0;
    
    debug('AI-enhanced agent initialized');
    
    return { success: true };
  }
  
  /**
   * Navigate to a URL with AI-enhanced understanding
   */
  async navigateTo(url: string): Promise<AgentActionResult> {
    const result = await super.navigateTo(url);
    if (!result.success) {
      return result;
    }
    
    // If AI planning is enabled, generate a plan for the current page
    if (this.aiOptions.useAutonomousPlanning) {
      try {
        await this.createPlanForPage("Analyze this page and find the most important information");
      } catch (error) {
        debug(`AI planning failed, continuing with navigation: ${error}`);
      }
    }
    
    return result;
  }
  
  /**
   * Get the current page context for AI operations
   */
  private async getPageContext(): Promise<any> {
    // Take a screenshot to use for visual analysis
    const screenshotResult = await super.takeScreenshot();
    if (!screenshotResult.success) {
      throw new Error(`Failed to take screenshot: ${screenshotResult.error}`);
    }
    
    const screenshotData = screenshotResult.data.screenshot;
    const screenshotBase64 = `data:image/jpeg;base64,${screenshotData.toString('base64')}`;
    
    // Get page dimensions
    const browser = this.getBrowserInterface();
    const dimensions = await browser.getPageDimensions();
    
    // Get page title and URL
    const title = await super.getPageTitle();
    const url = await super.getCurrentUrl();
    
    // Get document structure (this is simplified - in a real implementation, 
    // we'd need to extract DOM structure)
    const documentStructure = await browser.evaluate(`() => {
      // Return a basic structure of the document
      function getBasicDOMStructure(element, depth = 0, maxDepth = 3) {
        if (depth > maxDepth) return null;
        
        const children = Array.from(element.children)
          .map(child => getBasicDOMStructure(child, depth + 1, maxDepth))
          .filter(Boolean);
        
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || undefined,
          className: element.className || undefined,
          text: element.textContent?.trim().substring(0, 100) || undefined,
          children: children.length > 0 ? children : undefined
        };
      }
      
      return getBasicDOMStructure(document.body);
    }`);
    
    // Return a context object for AI operations
    return {
      screenshotBase64,
      size: {
        width: dimensions.width,
        height: dimensions.height
      },
      tree: documentStructure,
      title,
      url
    };
  }
  
  /**
   * Get the browser interface (for internal use)
   */
  private getBrowserInterface(): BrowserInterface {
    return (this as any).browser;
  }
  
  /**
   * Save a screenshot to the output directory
   */
  private saveScreenshot(screenshotData: Buffer): string {
    if (!this.aiOptions.outputDir) {
      return '';
    }
    
    try {
      const screenshotsDir = path.join(this.aiOptions.outputDir, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }
      
      const filename = `screenshot-${Date.now()}-${++this.screenshotCounter}.jpg`;
      const filePath = path.join(screenshotsDir, filename);
      
      fs.writeFileSync(filePath, screenshotData);
      return filePath;
    } catch (error) {
      debug(`Failed to save screenshot: ${error}`);
      return '';
    }
  }
  
  /**
   * Create a plan for the current page using Midscene's AI planning
   */
  async createPlanForPage(instruction: string): Promise<AgentActionResult> {
    try {
      // Get current page context
      const context = await this.getPageContext();
      
      // Check if midsceneCore has plan function
      if (typeof midsceneCore.plan === 'function') {
        const planningResult = await midsceneCore.plan(instruction, {
          context,
          pageType: 'web' as any // Cast to any to avoid PageType typing issues
        });
        
        debug('AI planning result:', planningResult);
        
        return {
          success: true,
          data: {
            plan: planningResult
          }
        };
      } else {
        debug('midsceneCore.plan function not available, using alternative implementation');
        
        // Simplified mock planning implementation
        const mockPlan = {
          actions: [
            {
              type: 'extract',
              params: {
                selector: 'h1, h2, .content, article'
              }
            }
          ]
        };
        
        return {
          success: true,
          data: {
            plan: mockPlan
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create plan: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Locate and click on an element described in natural language
   */
  async clickOnElement(description: string): Promise<AgentActionResult> {
    try {
      const locateResult = await this.locateElement(description);
      
      if (!locateResult.success) {
        return locateResult;
      }
      
      const { position } = locateResult.data;
      
      if (!position) {
        return {
          success: false,
          error: `Located element "${description}" but could not determine position for clicking`
        };
      }
      
      // Click at the element's position
      const browser = this.getBrowserInterface();
      await browser.clickAt(position.x, position.y);
      
      return {
        success: true,
        data: {
          clicked: true,
          element: locateResult.data.element
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to click on element "${description}": ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Locate an element on the page using AI visual understanding
   */
  async locateElement(description: string): Promise<AgentActionResult> {
    try {
      const context = await this.getPageContext();
      
      // Try to use midsceneCore's AiLocateElement if available
      if (typeof midsceneCore.AiLocateElement === 'function') {
        const locateResult = await midsceneCore.AiLocateElement({
          context,
          targetElementDescription: description
        });
        
        if (!locateResult.parseResult?.elements?.length) {
          return {
            success: false,
            error: `Could not find element: ${description}`
          };
        }
        
        // Get the first matched element
        const element = locateResult.parseResult.elements[0];
        const rect = locateResult.rect;
        
        // If we have a bounding box, we can click on the element
        if (rect) {
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          
          return {
            success: true,
            data: {
              element,
              rect,
              position: { x, y }
            }
          };
        }
        
        return {
          success: true,
          data: {
            element,
            rect
          }
        };
      } else {
        // Fallback to a basic selector-based approach
        debug('midsceneCore.AiLocateElement function not available, using fallback');
        
        // Find a selector based on the description
        let selector: string;
        
        if (description.toLowerCase().includes('button')) {
          selector = 'button, [role="button"], .btn, a.button';
        } else if (description.toLowerCase().includes('input') || description.toLowerCase().includes('text') || description.toLowerCase().includes('field')) {
          selector = 'input, textarea';
        } else if (description.toLowerCase().includes('link')) {
          selector = 'a';
        } else {
          selector = `*:contains("${description}")`;
        }
        
        // Evaluate the selector to find elements
        const elements = await this.getBrowserInterface().evaluate<Array<{
          tagName: string;
          text: string;
          rect: { left: number; top: number; width: number; height: number };
        }>>(`(selector) => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map(el => {
            const rect = el.getBoundingClientRect();
            return {
              tagName: el.tagName.toLowerCase(),
              text: el.textContent?.trim() || '',
              rect: {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
              }
            };
          });
        }`, selector);
        
        if (!elements.length) {
          return {
            success: false,
            error: `Could not find element: ${description}`
          };
        }
        
        const element = elements[0];
        const rect = element.rect;
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        return {
          success: true,
          data: {
            element,
            rect,
            position: { x, y }
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to locate element "${description}": ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Locate an element and input text into it
   */
  async inputTextIntoElement(description: string, text: string): Promise<AgentActionResult> {
    try {
      const locateResult = await this.locateElement(description);
      
      if (!locateResult.success) {
        return locateResult;
      }
      
      const { position } = locateResult.data;
      
      if (!position) {
        return {
          success: false,
          error: `Located element "${description}" but could not determine position for clicking`
        };
      }
      
      // Click at the element's position to focus it
      const browser = this.getBrowserInterface();
      await browser.clickAt(position.x, position.y);
      
      // Type the text
      await browser.type(text);
      
      return {
        success: true,
        data: {
          inputted: true,
          text,
          element: locateResult.data.element
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to input text into element "${description}": ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Execute a plan that was created with createPlanForPage
   */
  async executePlan(plan: any): Promise<AgentActionResult> {
    try {
      const actions = plan.actions || [];
      const results = [];
      
      for (const action of actions) {
        const actionType = action.type;
        const actionParams = action.params || {};
        
        switch (actionType) {
          case 'click':
            const clickResult = await this.clickOnElement(actionParams.element);
            results.push({
              type: 'click',
              success: clickResult.success,
              data: clickResult.data,
              error: clickResult.error
            });
            break;
            
          case 'input':
            const inputResult = await this.inputTextIntoElement(
              actionParams.element,
              actionParams.text
            );
            results.push({
              type: 'input',
              success: inputResult.success,
              data: inputResult.data,
              error: inputResult.error
            });
            break;
            
          case 'extract':
            // Extract data from elements
            const extractResult = await super.extractText(actionParams.selector || 'body');
            results.push({
              type: 'extract',
              success: extractResult.success,
              data: extractResult.data,
              error: extractResult.error
            });
            break;
            
          default:
            debug(`Unsupported action type: ${actionType}`);
            results.push({
              type: actionType,
              success: false,
              error: `Unsupported action type: ${actionType}`
            });
        }
        
        // If the action failed and it's not optional, stop execution
        if (!results[results.length - 1].success && !actionParams.optional) {
          break;
        }
      }
      
      return {
        success: results.every(r => r.success),
        data: {
          actions: results
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to execute plan: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Close the browser and cleanup
   */
  async close(): Promise<void> {
    await super.close();
  }
} 