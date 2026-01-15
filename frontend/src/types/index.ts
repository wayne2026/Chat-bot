export interface Message {
    _id?: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
}

export interface User {
    id: string;
    email: string;
}

export interface AuthState {
    token: string | null;
    user: User | null;
}
