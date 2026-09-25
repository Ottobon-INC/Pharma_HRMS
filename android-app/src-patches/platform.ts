/**
 * Orca Labs Pharma HRMS — Platform Detection Utility
 *
 * Provides runtime checks for the current execution environment.
 * Used throughout the React codebase to conditionally apply
 * native Capacitor APIs vs. web browser APIs.
 *
 * Place: src/lib/platform.ts (in the PARENT web project)
 */

import { Capacitor } from '@capacitor/core';

/** True when running inside a native Capacitor app (Android/iOS) */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/** True when running on Android (native only) */
export const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';

/** True when running in a standard web browser */
export const isWeb = (): boolean => !Capacitor.isNativePlatform();

/** Returns the current platform string: 'android' | 'ios' | 'web' */
export const getPlatform = (): string => Capacitor.getPlatform();
