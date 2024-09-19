import {
Controller,
Get,
Post,
Body,
Param,
UseGuards,
UploadedFiles,
UseInterceptors,
BadRequestException,
Req,
Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express'; // Correct import
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { plainToClass } from 'class-transformer';
import { DashboardService } from './services/dashboard.service';  

@Controller('')
@ApiTags('Posts')
export class DashboardController {
constructor(private readonly dashboardService: DashboardService) {}

    @Get('/dashboard')
    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all posts with related data' })
    @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 400, description: 'Failed to retrieve posts' })
    async getPosts(@Req() request) {
        const user = request.user;
        return await this.dashboardService.getPostTypesForIntegration(user.id);
    }
}
