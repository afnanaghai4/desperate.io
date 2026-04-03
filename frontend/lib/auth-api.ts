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

export async function loginUser(payload: LoginPayload) {
    const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return response;
}

export async function signupUser(payload: { username: string; email: string; password: string }) {
    const response = await apiFetch<SignUpResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return response;
}

