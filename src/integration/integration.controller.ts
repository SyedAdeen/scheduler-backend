import { Controller, Get, UseGuards, Req, Param, Delete, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { IntegrationService } from "./services/integration.service";
import { Integration } from "@entities/integration.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { IntegrationDto } from "./dtos/get-integration.dto";
import { instanceToPlain } from "class-transformer";

@Controller("integrations")
@ApiTags("Integration")

export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get("")
  @ApiBearerAuth('access-token') 
  @UseGuards(JwtAuthGuard)  
  @ApiOperation({ summary: "Get integrations for a specific user" })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 200,
    description: "List of integrations for the user",
    type: [Integration],
  })
  async getIntegrationsForUser(
    @Req() request: any // Inject the request object
  ){
    const user = request.user; 
    const integrations = await this.integrationService.getIntegrationsForUser(user.id);
    return instanceToPlain(integrations);
  }

  @Get("/:integrationId(\\d+)") 
  @ApiBearerAuth('access-token') 
  @UseGuards(JwtAuthGuard)  
  @ApiOperation({ summary: 'Get Authorization URL for a specific integration' })
  @ApiResponse({ status: 401, description: 'Unauthorized I am herre' })
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
  @ApiBearerAuth('access-token') 
  @UseGuards(JwtAuthGuard)  
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

  @Get('exchange-code')
  @ApiOperation({ summary: 'Exchange code for tokens' })
  @ApiResponse({ status: 200, description: 'Access and refresh tokens exchanged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exchangeCode(
    @Query('code') code: string, 
    @Query('state') state: string,
    @Req() req: Request,
  ) {
    // Parse the state parameter to get userId and integrationId
    const { userId, integrationId } = JSON.parse(decodeURIComponent(state)); 

    // Exchange the code for tokens
    return instanceToPlain(this.integrationService.exchangeCodeForTokens(code, userId, integrationId));
  }

}
