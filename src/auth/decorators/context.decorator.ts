import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { User } from "@entities/user.entity";

export type Context = {
    user?: User;
};

export const Ctx = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): Context => {
        const request = ctx.switchToHttp().getRequest();
        return {
            user: plainToInstance(User, request.user),
        };
    },
);
