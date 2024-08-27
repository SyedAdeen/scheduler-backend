import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user;  // Access the authenticated user object from JWT
    console.log("User i am here",user);

    if (!user) {
      throw new UnauthorizedException('You are not authorized to access this resource.');
    }

    next();
  }
}
