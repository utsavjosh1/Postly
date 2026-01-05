export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  userType: 'job_seeker' | 'employer';
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    userType: 'job_seeker' | 'employer';
  };
  accessToken: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
