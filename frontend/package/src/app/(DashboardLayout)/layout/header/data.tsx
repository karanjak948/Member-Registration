/*
 * Header data
 *
 * The original Modernize template contained
 * demo notifications, inbox links, tasks,
 * eCommerce links, chat links, and other
 * sample application data.
 *
 * Those items have been removed because they
 * are not part of the Member Registration
 * Management System.
 *
 * Real notification data will be added when
 * the approval workflow is implemented.
 */

export interface SystemNotification {
  id: number | string;
  title: string;
  message: string;
  created_at?: string;
  read?: boolean;
  href?: string;
}

export const notifications: SystemNotification[] =
  [];