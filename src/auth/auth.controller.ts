import {
    Body,
    Controller,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from "@nestjs/common";
import { AuthService } from "./services/auth.service";
import { LocalUserAuthGuard } from "./guards/local-user-auth.guard";
import { LoginDto } from "./dtos/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ForgotPasswordDto } from "./dtos/forgot-password.dto";
import { ResetPasswordDto } from "./dtos/reset-password.dto";
import { Context, Ctx } from "./decorators/context.decorator";
import { SignupDto } from "./dtos/signup.dto";

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
    constructor(private authService: AuthService) {}
<<<<<<< Updated upstream

    @Post("auth/register")
=======
 
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    @ApiResponse({ status: 400, description: 'Email Already Exists' })
>>>>>>> Stashed changes
    async register(@Body() signupDto: SignupDto) {

    }

    @ApiBearerAuth()
    @UseGuards(LocalUserAuthGuard)
    @Post("login")
    async login(@Body() loginDto: LoginDto) {
        return this.authService.authenticate(
            loginDto.username,
            loginDto.password,
        );
    }

    @Post("forgot")
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        
    }

    @Patch("forgot/reset")
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        
    }
}
