import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { IntegrationService } from "./services/integration.service";
import { Integration } from "@entities/integration.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"; // Keep the JwtAuthGuard if you still want to protect the route

@Controller("integrations")
@ApiTags("Integration")
@ApiBearerAuth('access-token') 
@UseGuards(JwtAuthGuard)  // Apply JwtAuthGuard if needed, can be removed if handled in middleware
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get("")
  @ApiOperation({ summary: "Get integrations for a specific user" })
  @ApiResponse({
    status: 200,
    description: "List of integrations for the user",
    type: [Integration],
  })
  async getIntegrationsForUser(
    @Req() request: any // Inject the request object
  ): Promise<Integration[]> {
    const user = request.user;  // The user is already set by AuthMiddleware
    const integrations = await this.integrationService.getIntegrationsForUser(user.id);
    return integrations;
  }
}
