import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Registration was successful.' })
  @ApiResponse({ status: 400, description: 'Invalid user data.' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @ApiOperation({ summary: 'Login using email and password' })
  @ApiResponse({ status: 200, description: 'Login successful with token returned.' })
  @ApiResponse({ status: 401, description: 'Invalid username or password.' })
  @Post('login')
  login(@Body() dto: RegisterDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @ApiOperation({ summary: 'Refresh JWT tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid refresh payload.' })
  @Post('refresh')
  refresh(@Body() body: any) {
    return this.authService.refresh(body.userId, body.refreshToken);
  }
}