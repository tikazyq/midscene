import fs from 'fs-extra';

/**
 * Sanitize a string for use as a filename
 */
export function sanitizeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

/**
 * Create a directory if it doesn't exist
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url.split('/')[0];
  }
}

/**
 * Group URLs by domain pattern
 */
export function groupUrlsByDomain(urls: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  
  urls.forEach(url => {
    const domain = extractDomain(url);
    groups[domain] = groups[domain] || [];
    groups[domain].push(url);
  });
  
  return groups;
}

/**
 * Create JavaScript selector from element properties
 */
export function createSelector(
  element: {
    tagName?: string;
    attributes?: Record<string, string>;
    text?: string;
  },
  description: string
): string {
  // Simple matcher for common elements based on description
  const descLower = description.toLowerCase();
  
  // Login buttons
  if (descLower.includes('login') && descLower.includes('button')) {
    return 'button:has-text("Login"), a:has-text("Login"), .login-button, [type="submit"]:has-text("Login")';
  }
  
  // Search inputs
  if (descLower.includes('search')) {
    return 'input[type="search"], input[placeholder*="search" i], [aria-label*="search" i]';
  }
  
  // Next page buttons
  if ((descLower.includes('next') || descLower.includes('more')) && 
      (descLower.includes('page') || descLower.includes('result'))) {
    return 'a:has-text("Next"), button:has-text("Next"), .pagination .next, .next-page, [aria-label="Next page"]';
  }
  
  // Try to create a selector based on element properties
  if (element) {
    const selectors = [];
    
    if (element.tagName) {
      selectors.push(element.tagName.toLowerCase());
    }
    
    if (element.attributes) {
      // Add id selector if available
      if (element.attributes.id) {
        selectors.push(`#${element.attributes.id}`);
      }
      
      // Add class selectors
      if (element.attributes.class) {
        const classes = element.attributes.class.split(/\s+/)
          .filter(c => c && !c.includes(':'))
          .map(c => `.${c}`)
          .join('');
        if (classes) selectors.push(classes);
      }
      
      // Add data attributes
      Object.entries(element.attributes)
        .filter(([key]) => key.startsWith('data-'))
        .forEach(([key, value]) => {
          selectors.push(`[${key}="${value}"]`);
        });
    }
    
    // Add text content selector
    if (element.text) {
      const text = element.text.trim().substring(0, 50);
      if (text) {
        selectors.push(`:has-text("${text.replace(/"/g, '\\"')}")`);
      }
    }
    
    if (selectors.length > 0) {
      return selectors.join(', ');
    }
  }
  
  // Fallback to description-based text selector
  return `:text("${description.replace(/"/g, '\\"')}")`;
} 