import { renderHook, act } from '@testing-library/react';
import { useInstallPrompt } from '../useInstallPrompt';

describe('useInstallPrompt', () => {
  const originalMatchMedia = window.matchMedia;
  const originalLocalStorage = window.localStorage;
  
  beforeEach(() => {
    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    // Clear localStorage
    localStorage.clear();
  });
  
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    jest.clearAllMocks();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useInstallPrompt());
    
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.showPrompt).toBe(false);
    expect(typeof result.current.promptInstall).toBe('function');
    expect(typeof result.current.dismissPrompt).toBe('function');
  });

  it('detects standalone mode as installed', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    const { result } = renderHook(() => useInstallPrompt());
    
    expect(result.current.isInstalled).toBe(true);
  });

  it('dismissPrompt sets localStorage and hides prompt', () => {
    const { result } = renderHook(() => useInstallPrompt());
    
    act(() => {
      result.current.dismissPrompt();
    });
    
    expect(localStorage.getItem('pwa-install-dismissed')).toBeTruthy();
    expect(result.current.showPrompt).toBe(false);
  });

  it('detects iOS devices', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
    
    const { result } = renderHook(() => useInstallPrompt());
    
    expect(result.current.isIOS).toBe(true);
    
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('responds to beforeinstallprompt event', () => {
    const { result } = renderHook(() => useInstallPrompt());
    
    const mockEvent = new Event('beforeinstallprompt') as Event & {
      preventDefault: jest.Mock;
      prompt: jest.Mock;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    };
    mockEvent.preventDefault = jest.fn();
    
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    
    expect(result.current.isInstallable).toBe(true);
    expect(result.current.showPrompt).toBe(true);
  });

  it('does not show prompt if recently dismissed', () => {
    // Set dismissed timestamp to now
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    
    const { result } = renderHook(() => useInstallPrompt());
    
    const mockEvent = new Event('beforeinstallprompt');
    
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    
    expect(result.current.showPrompt).toBe(false);
  });

  it('handles appinstalled event', () => {
    const { result } = renderHook(() => useInstallPrompt());
    
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.showPrompt).toBe(false);
  });
});
