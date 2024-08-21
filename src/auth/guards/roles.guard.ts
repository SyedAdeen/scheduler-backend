import {
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const roles = this.reflector.get<number[]>(
            "roles",
            context.getHandler(),
        );
        if (!roles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        if (!request.user) {
            throw new UnauthorizedException("Unauthorized");
        }
        return (
            roles.findIndex(
                (role) => role === parseInt(request.user.role),
            ) >= 0
        );
    }
}
