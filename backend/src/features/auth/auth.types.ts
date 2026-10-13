export interface AuthTokenPayload {
  id: string;
  email: string;
  role: 'admin' | 'lead' | 'developer' | 'qa' | 'guest';
}

export interface LoginCredentials {
  email: string;
  password: string;
}
