export type NotificationType =
  | 'property_published'
  | 'office_approved'
  | 'office_rejected'
  | 'new_inquiry'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  email_sent_at: string | null;
  created_at: string;
}
