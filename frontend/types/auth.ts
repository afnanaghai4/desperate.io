export type LoginFormData = {
    email: string;
    password: string;
};

export type LoginResponse = {
accessToken: string;
user: {
    id:string;
    email:string;
};
};