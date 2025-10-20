declare const config: {
    port: number;
    jwtSecret: string;
    jwtExpiresIn: number;
    database: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
    };
    reportService: {
        url: string;
    };
};
export default config;
//# sourceMappingURL=env.d.ts.map