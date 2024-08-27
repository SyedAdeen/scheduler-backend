import "dotenv/config";
import { DataSource } from "typeorm";
import { Integration } from "./entities/integration.entity"; // Adjust the path as needed
import {User} from './entities/user.entity';
import {UserIntegration} from './entities/user-integration.entity';

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL
};

const isDevelopment = process.env.NODE_ENV !== 'production';

export default new DataSource({
    type: "postgres",
    host: config.host,
    ssl: config.ssl === "false",
    port: parseInt(config.port),
    username: config.user,
    password: config.password,
    database: config.database,
    entities: isDevelopment ? [User, Integration, UserIntegration] : ["dist/**/*.entity.js"],
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

