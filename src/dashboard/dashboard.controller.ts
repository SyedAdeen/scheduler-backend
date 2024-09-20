import {
    Controller,
    Post,
    UseGuards,
    Req,
    Body,
    Logger,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './services/dashboard.service';
import { PostCountsDto } from './dtos/post-counts.dto'; // DTO for handling request body

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
    private readonly logger = new Logger(DashboardController.name);

    constructor(private readonly dashboardService: DashboardService) {}

    @Post('post-counts')  // Changed to POST
    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get post counts by recurring type and post history' })
    @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 400, description: 'Failed to retrieve posts' })
    async getPostCounts(
        @Req() request, 
        @Body() postCountsDto: PostCountsDto // Accept body input for recurring type
    ): Promise<any> {
        const user = request.user;
        this.logger.log(`Fetching post counts for user ID: ${user.id}`);
        return await this.dashboardService.getPostCountsForIntegration(user.id, postCountsDto.recurringType);
    }
}
