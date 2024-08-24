import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailAlreadyExistException extends HttpException {
    constructor() {
        super('Email Already Exists', HttpStatus.BAD_REQUEST);
    }
}

export class UserNotFoundException extends HttpException {
    constructor() {
        super('User Not Found', HttpStatus.NOT_FOUND);
    }
}

export class TokenExpiredException extends HttpException {
    constructor() {
        super('Token has expired', HttpStatus.UNAUTHORIZED);
    }
}

export class InvalidCodeException extends HttpException {
    constructor() {
        super('Verification code is incorrect', HttpStatus.BAD_REQUEST);
    }
}

export class SignInWithGoogleException extends HttpException {
    constructor() {
        super('Sign in with Google', HttpStatus.BAD_REQUEST);
    }
}

export class ValidationErrorException extends HttpException {
    constructor() {
        super('Invalid User', HttpStatus.BAD_REQUEST);
    }
}

export class UnauthorizedException extends HttpException {
    constructor(message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}

export class BadRequestException extends HttpException {
    constructor(message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}



