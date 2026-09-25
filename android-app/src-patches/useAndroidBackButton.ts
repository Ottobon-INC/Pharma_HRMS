/**
 * Orca Labs Pharma HRMS — Android Back Button Hook
 *
 * Handles Android hardware back button behavior.
 * Integrates with the tab-based router in App.tsx.
 *
 * Place: src/hooks/useAndroidBackButton.ts (in the PARENT web project)
 */

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { isAndroid } from './platform';

interface UseAndroidBackButtonOptions {
  /** Called when back is pressed and there's a previous tab to go to */
  onBack: () => void;
  /** If true, pressing back will show an exit confirmation (for root screens) */
  isRootScreen?: boolean;
}

export function useAndroidBackButton({
  onBack,
  isRootScreen = false,
}: UseAndroidBackButtonOptions): void {
  useEffect(() => {
    if (!isAndroid()) return;

    const handlerPromise = App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
      if (isRootScreen || !canGoBack) {
        // On root screens, exit the app
        App.exitApp();
      } else {
        onBack();
      }
    });

    return () => {
      handlerPromise.then((h: any) => h?.remove?.());
    };
  }, [onBack, isRootScreen]);
}
