import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailExist extends HttpException {
    constructor() {
        super('Email Already Exists', HttpStatus.BAD_REQUEST);
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

export class ValidationError extends HttpException {
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



