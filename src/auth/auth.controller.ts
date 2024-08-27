import { Body, Controller, Patch, Post } from "@nestjs/common";
import { AuthService } from "./services/auth.service";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ForgotPasswordDto } from "./dtos/forgot-password.dto";
import { SignupDto } from "./dtos/signup.dto";
import { VerifyRegisterDto } from "./dtos/verify-register.dto";
import { GoogleAuthDto } from "./dtos/googleauth.dto";
import { ForgotPasswordVerifyDto } from "./dtos/verify-forgot-password.dto";
import { LoginDto } from "./dtos/login.dto";
import { instanceToPlain } from 'class-transformer';

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    @ApiResponse({ status: 400, description: 'Email Already Exists' })
    async register(@Body() signupDto: SignupDto) {
        const { name, email, password } = signupDto;
        const token = await this.authService.register(name, email, password);
        return { token };
    }

    @Post('register/verify')
    @ApiOperation({ summary: 'Verify registration with a code' })
    @ApiResponse({ status: 200, description: 'Registration verified successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid token or code.' })
    async verifyRegistration(@Body() verifyRegisterDto: VerifyRegisterDto) {
        const { token, code } = verifyRegisterDto;
        const success = await this.authService.verifyRegistration(token, code);
        return { success };
    }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 201, description: 'Login successful.' })
    @ApiResponse({ status: 400, description: 'Sign In with Google' })
    @ApiResponse({ status: 401, description: 'Incorrect Password' })
    @ApiResponse({ status: 404, description: 'User Not Found' })
    async login(@Body() loginDto: LoginDto) {
        const { email, password } = loginDto;
        const { user, token } = await this.authService.login(email, password);

        // Transform user entity to plain object to exclude sensitive fields
        const userWithoutPassword = instanceToPlain(user);

        return { user: userWithoutPassword, token };
    }

    @Post('googleauth')
    @ApiOperation({ summary: 'Login with Google' })
    @ApiResponse({ status: 201, description: 'Google login successful.' })
    @ApiResponse({ status: 500, description: 'Server Error, Old Id Token' })
    async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
        const { user, token } = await this.authService.googleAuthService(googleAuthDto.idToken);
        const userWithoutPassword = instanceToPlain(user);
        return { user: userWithoutPassword, token };
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({ status: 200, description: 'Password reset request successful.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    @ApiResponse({ status: 400, description: 'Error requesting password reset.' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        const { email } = forgotPasswordDto;
        const token = await this.authService.forgotPassword(email);
        return { token };
    }

    @Patch('forgot-password/verify')
    @ApiOperation({ summary: 'Verify password reset with a code' })
    @ApiResponse({ status: 200, description: 'Password reset verified successfully.' })
    @ApiResponse({ status: 401, description: 'Incorrect code or token not found.' })
    async verifyForgotPassword(@Body() forgotPasswordVerifyDto: ForgotPasswordVerifyDto) {
        const { token, code, newPassword } = forgotPasswordVerifyDto;
        return this.authService.verifyForgotPassword(token, code, newPassword);
    }
}
