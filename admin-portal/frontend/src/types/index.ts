// types/index.ts

export interface FormConstants {
  research_areas: string[];
  degree_types: string[];
  academic_years: string[];
  institutions: string[];
}

export interface ProjectFormData {
  title: string;
  abstract?: string;
  keywords?: string;
  research_area?: string;
  custom_research_area?: string;
  degree_type?: string;
  custom_degree_type?: string;
  academic_year?: string;
  institution?: string;
  custom_institution?: string;
  department?: string;
  supervisor?: string;
  author_name: string;
  author_email?: string;
  meta_description?: string;
  meta_keywords?: string;
  is_published?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  institution?: string;
  department?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  abstract?: string;
  keywords?: string;
  research_area?: string;
  degree_type?: string;
  academic_year?: string;
  institution?: string;
  department?: string;
  supervisor?: string;
  author_name: string;
  author_email?: string;
  is_published: boolean;
  publication_date: string;
  view_count: number;
  download_count: number;
  document_url?: string;
  document_filename?: string;
  document_size?: number;
  document_public_id?: string;
  document_storage?: string;
  created_by_id?: number;
  created_at: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface DashboardStats {
  total_projects: number;
  published_projects: number;
  draft_projects: number;
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_downloads: number;
  total_views: number;
  recent_projects: Array<{
    id: number;
    title: string;
    author_name: string;
    created_at: string;
    is_published: boolean;
  }>;
  research_areas: Array<{
    name: string;
    count: number;
  }>;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}
