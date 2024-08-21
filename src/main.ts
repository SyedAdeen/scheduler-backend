import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { useContainer } from "class-validator";
import { AppModule } from "./app.module";

const logger = new Logger();

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    const config = new DocumentBuilder()
        .setTitle("PostFlow")
        .setDescription("PostFlow API Documentation")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    app.useGlobalPipes(new ValidationPipe());
    SwaggerModule.setup("docs", app, document);
    await app.listen(process.env.PORT || 3000);
    logger.log(`Server started on port: ${process.env.PORT}`);
}

bootstrap();
