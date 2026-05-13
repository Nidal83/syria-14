export type OfficeApplicationStatus = 'pending_review' | 'approved' | 'rejected';

export interface OfficeApplication {
  id: string;
  user_id: string;
  office_name: string;
  office_slug: string;
  phone: string;
  city: string;
  description: string;
  logo_url: string | null;
  document_url: string | null;
  id_document_url: string | null;
  status: OfficeApplicationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Office {
  id: string;
  user_id: string;
  application_id: string | null;
  name: string;
  slug: string;
  phone: string;
  city: string;
  description: string;
  logo_url: string | null;
  whatsapp: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
