
/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function(...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall < wait) return;
    lastCall = now;
    return func(...args);
  };
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = window.setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Returns true if the provided object is significantly different from the previous object
 * Used for performance optimization to avoid unnecessary updates
 */
export function hasSignificantChanges(
  obj1: Record<string, any>, 
  obj2: Record<string, any>,
  threshold = 0.1
): boolean {
  // For positions, only update if changed by more than threshold
  if ('x' in obj1 && 'x' in obj2 && 
      'y' in obj1 && 'y' in obj2) {
    const xDiff = Math.abs(obj1.x - obj2.x);
    const yDiff = Math.abs(obj1.y - obj2.y);
    return xDiff > threshold || yDiff > threshold;
  }
  return false;
}
