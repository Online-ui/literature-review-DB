import axios, { AxiosResponse } from 'axios';
import { User, Project, DashboardStats, LoginRequest, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

class AdminApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  constructor() {
    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors and format error messages
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/login';
        }
        
        // Format error message for better display
        if (error.response?.data) {
          const errorData = error.response.data;
          
          // Handle FastAPI validation errors
          if (Array.isArray(errorData.detail)) {
            const messages = errorData.detail.map((err: any) => {
              if (typeof err === 'object' && err.msg) {
                return `${err.loc?.join(' → ') || 'Field'}: ${err.msg}`;
              }
              return err.toString();
            });
            error.message = messages.join(', ');
          } else if (typeof errorData.detail === 'string') {
            error.message = errorData.detail;
          } else if (errorData.message) {
            error.message = errorData.message;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication

async login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    console.log('Attempting login with:', credentials.username); // Debug log
    
    const response = await this.api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Login response:', response.data); // Debug log
    return response.data;
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
}

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  // Users
  async getUsers(): Promise<User[]> {
    const response = await this.api.get('/users/');
    return response.data;
  }

  async createUser(userData: any): Promise<User> {
    const response = await this.api.post('/users/', userData);
    return response.data;
  }

  async updateUser(userId: number, userData: any): Promise<User> {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.api.delete(`/users/${userId}`);
  }

  async toggleUserStatus(userId: number): Promise<void> {
    await this.api.patch(`/users/${userId}/toggle-status`);
  }

  // Projects
  async getProjects(params?: {
    search?: string;
    research_area?: string;
    degree_type?: string;
    is_published?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<Project[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.research_area) searchParams.append('research_area', params.research_area);
    if (params?.degree_type) searchParams.append('degree_type', params.degree_type);
    if (params?.is_published !== undefined) searchParams.append('is_published', params.is_published.toString());
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await this.api.get(`/projects/?${searchParams}`);
    return response.data;
  }

  async createProject(projectData: FormData): Promise<Project> {
    const response = await this.api.post('/projects/', projectData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateProject(projectId: number, projectData: FormData): Promise<Project> {
    const response = await this.api.put(`/projects/${projectId}`, projectData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteProject(projectId: number): Promise<void> {
    await this.api.delete(`/projects/${projectId}`);
  }

  async toggleProjectStatus(projectId: number): Promise<void> {
    await this.api.patch(`/projects/${projectId}/toggle-publish`);
  }

  async getResearchAreas(): Promise<string[]> {
    const response = await this.api.get('/projects/research-areas/list');
    return response.data;
  }

  async getDegreeTypes(): Promise<string[]> {
    const response = await this.api.get('/projects/degree-types/list');
    return response.data;
  }

  async deleteProjectFile(projectId: number): Promise<void> {
    await this.api.delete(`/projects/${projectId}/file`);
  }
}

export const adminApi = new AdminApiService();