/**
 * Centralized haptic feedback. Wraps expo-haptics calls with safe
 * try/catch so they never throw on devices that don't support haptics.
 */
import * as Haptics from 'expo-haptics';

export const light = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
export const medium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
export const heavy = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
export const warning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
export const error = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

export const selection = () => Haptics.selectionAsync().catch(() => {});
