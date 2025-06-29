import axios from 'axios'; // Add this import

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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
  created_at: string;
  updated_at?: string;
}

export interface ProjectSummary {
  id: number;
  title: string;
  slug: string;
  abstract?: string;
  research_area?: string;
  degree_type?: string;
  institution?: string;
  author_name: string;
  publication_date: string;
  view_count?: number;
  download_count?: number;
  is_published?: boolean;
}

export interface SearchFilters {
  query?: string;
  research_area?: string;
  degree_type?: string;
  institution?: string;
  academic_year?: string;
}

export interface SearchResponse {
  projects: ProjectSummary[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  filters: SearchFilters;
}

export interface SiteStats {
  total_projects: number;
  total_institutions: number;
  total_research_areas: number;
  total_downloads: number;
}

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  async getFeaturedProjects(limit: number = 6): Promise<ProjectSummary[]> {
    try {
      const response = await this.api.get(`/projects/featured?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch featured projects:', error);
      return [];
    }
  }

  async getSiteStats(): Promise<SiteStats> {
    try {
      const response = await this.api.get('/projects/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch site stats:', error);
      return {
        total_projects: 0,
        total_institutions: 0,
        total_research_areas: 0,
        total_downloads: 0
      };
    }
  }

  async searchProjects(filters: SearchFilters, page: number = 1, perPage: number = 12): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('search', filters.query);
      if (filters.research_area) params.append('research_area', filters.research_area);
      if (filters.degree_type) params.append('degree_type', filters.degree_type);
      
      params.append('skip', ((page - 1) * perPage).toString());
      params.append('limit', perPage.toString());

      const response = await this.api.get(`/projects/?${params.toString()}`);
      
      // Transform response to match expected format
      const projects = response.data;
      const total = projects.length; // You might want to add total count from backend
      
      return {
        projects,
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
        filters
      };
    } catch (error) {
      console.error('Failed to search projects:', error);
      return {
        projects: [],
        total: 0,
        page: 1,
        per_page: perPage,
        total_pages: 0,
        filters
      };
    }
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    try {
      const response = await this.api.get(`/projects/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project:', error);
      return null;
    }
  }

  async getResearchAreas(): Promise<string[]> {
    try {
      const response = await this.api.get('/projects/research-areas/list');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch research areas:', error);
      return [];
    }
  }

  async getInstitutions(): Promise<string[]> {
    try {
      const response = await this.api.get('/projects/institutions/list');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch institutions:', error);
      return [];
    }
  }

  async downloadProject(slug: string): Promise<void> {
    try {
      const response = await this.api.post(`/projects/${slug}/download`, {}, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${slug}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download project:', error);
      throw error;
    }
  }

  getDocumentViewUrl(slug: string): string {
    return `${API_BASE_URL}/projects/${slug}/view-document`;
  }
}

export const apiService = new ApiService();