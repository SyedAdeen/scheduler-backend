import "dotenv/config";
import { DataSource } from "typeorm";

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL
};

export default new DataSource({
    type: "postgres",
    host: config.host,
    ssl: config.ssl === "false",
    port: parseInt(config.port),
    username: config.user,
    password: config.password,
    database: config.database,
    entities: ["dist/**/*.entity.js"],
    synchronize: false,
    dropSchema: false,
    logging: ["warn", "error"],
    migrations: ["dist/common/database/migrations/**/*.js"],
    extra: config.ssl === "false" ? {
        ssl: {
            rejectUnauthorized: false,
        },
    } : {},
});

