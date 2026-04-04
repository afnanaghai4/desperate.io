import { apiFetch } from "./api";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    data: {
        accessToken: string;
        user: {
            id: number;
            email: string;
        };
    };
}

export interface SignUpResponse {
    message: string;
    data: {
        user: {
            id: number;
            email: string;
        };
    };
}

export interface UserInfo {
    id: number;
    email: string;
    username?: string;
}

export async function loginUser(payload: LoginPayload) {
    const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    // Note: The token is now stored in an HTTP-only cookie by the backend
    // We don't store it in JavaScript - the browser handles it automatically
    return response;
}

export async function signupUser(payload: { username: string; email: string; password: string }) {
    const response = await apiFetch<SignUpResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return response;
}

export async function checkAuth(): Promise<UserInfo | null> {
    try {
        const response = await apiFetch<{ data: UserInfo }>('/auth/me', {
            method: 'GET',
        });
        return response.data;
    } catch {
        return null;
    }
}

export async function logoutUser() {
    try {
        await apiFetch('/auth/logout', {
            method: 'POST',
        });
    } catch {
        
    }
}


