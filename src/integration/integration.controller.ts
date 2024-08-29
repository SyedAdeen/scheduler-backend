import { Controller, Get, UseGuards, Req, Param, Delete, ParseIntPipe  } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { IntegrationService } from "./services/integration.service";
import { Integration } from "@entities/integration.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"; // Keep the JwtAuthGuard if you still want to protect the route
import { IntegrationDto } from "./dtos/get-integration.dto";

@Controller("integrations")
@ApiTags("Integration")
@ApiBearerAuth('access-token') 
@UseGuards(JwtAuthGuard)  // Apply JwtAuthGuard if needed, can be removed if handled in middleware
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get("")
  @ApiOperation({ summary: "Get integrations for a specific user" })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 200,
    description: "List of integrations for the user",
    type: [Integration],
  })
  async getIntegrationsForUser(
    @Req() request: any // Inject the request object
  ): Promise<Integration[]> {
    const user = request.user; 
    const integrations = await this.integrationService.getIntegrationsForUser(user.id);
    return integrations;
  }

  @Get('/:integrationId')
  @ApiOperation({ summary: 'Get Authorization URL for a specific integration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request, Integration Not Found' })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL to add the integration',
    type: String,
  })
  async getAuthUrl(
    @Req() request: any, // Inject the request object
    @Param() params: IntegrationDto, // Use DTO here
  ): Promise<string> {
    const user = request.user; 
    const integrationId = params.integrationId;
    const authUrl = await this.integrationService.generateAuthUrl(user.id, integrationId);
    return authUrl;
  }
 
  @Delete('/:integrationId')
  @ApiOperation({ summary: 'Delete User Integration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'No UserIntegration found with given Integration ID and User ID' })
  @ApiResponse({
    status: 200,
    description: 'Remove the User Integration',
    type: Boolean,
  })
  async delUserIntegration(
    @Req() request: any, // Inject the request object
    @Param() params: IntegrationDto, // Use DTO here
  ): Promise<boolean> {
    const user = request.user; 
    const integrationId = params.integrationId; // Extracting integrationId from the DTO
    return this.integrationService.deleteUserIntegration(user.id, integrationId);
  }
}