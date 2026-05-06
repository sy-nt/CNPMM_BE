import config from "@config";
import appLogger from "@shared/lib/logger";
import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
    ...config.db.mysql,
    entities: [__dirname + "/../entities/*.entity.{ts,js}"],
    migrations: [__dirname + "/../migrations/*.{ts,js}"],
    synchronize: false,
    type: "mysql",
});

AppDataSource.initialize()
    .then(() => {
        appLogger.info("Database initialized");
    })
    .catch((error) => {
        appLogger.error("Error initializing database", error);
    });

export default AppDataSource;
