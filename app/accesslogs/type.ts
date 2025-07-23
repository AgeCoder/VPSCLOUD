export type AccessLog = {
    id: string;
    action: string;
    timestamp: string;
    user: { id: string; email: string };
    file: { id: string; originalFilename: string } | null;
};

export type ApiResponse = {
    logs: AccessLog[];
    total: number;
    page: number;
    totalPages: number;
};