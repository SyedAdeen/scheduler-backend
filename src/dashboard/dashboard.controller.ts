import {
    Controller,
    Get,
    UseGuards,
    Req,
    Logger,
    Param,
    Query
} from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBearerAuth,
    ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './services/dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
    private readonly logger = new Logger(DashboardController.name);

    constructor(private readonly dashboardService: DashboardService) {}

    @Get('/:integrationId') 
    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get post counts by integration and time range' })
    @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 400, description: 'Failed to retrieve posts' })
    @ApiQuery({ 
        name: 'startDate', 
        required: false, 
        type: String, 
        description: 'Start date in YYYY-MM-DD HH:mm:ssZ format', 
        example: `${new Date().toISOString().split('T')[0]} 00:00:00+05` // Default to current date at 00:00:00
    }) 
    @ApiQuery({ 
        name: 'endDate', 
        required: false, 
        type: String, 
        description: 'End date in YYYY-MM-DD HH:mm:ssZ format', 
        example: `${new Date().toISOString().split('T')[0]} 23:59:59+05` // Default to current date at 23:59:59
    }) 
    async getPostCounts(
        @Req() request, 
        @Param('integrationId') integrationId: number, // Integration ID from URL param
        @Query('startDate') startDate?: string, // Optional start date from query params
        @Query('endDate') endDate?: string // Optional end date from query params
    ): Promise<any> {
        const user = request.user;
        this.logger.log(`Fetching post counts for user ID: ${user.id}, Integration ID: ${integrationId}`);

        // Set default values for startDate and endDate if not provided
        const now = new Date();
        const currentDateString = now.toISOString().split('T')[0]; // YYYY-MM-DD format

        startDate = startDate || currentDateString; // Default to current date if not provided
        endDate = endDate || currentDateString; // Default to current date if not provided

        return await this.dashboardService.getPostCountsForIntegration(
            user.id, 
            integrationId, 
            startDate, 
            endDate
        );
    }
}
