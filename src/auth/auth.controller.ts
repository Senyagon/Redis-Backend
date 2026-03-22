import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TokensResponseDto } from './dto/tokens-response.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registration was successful. Access and refresh tokens returned.',
    type: TokensResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid email or password format.' })
  @ApiConflictResponse({ description: 'Email already exists.' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @ApiOperation({ summary: 'Login using email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login successful. Access and refresh tokens returned.',
    type: TokensResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid email or password format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @ApiOperation({ summary: 'Refresh JWT tokens' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully.',
    type: TokensResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid userId or refreshToken format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid userId or refreshToken.' })
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.userId, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiOkResponse({
    description: 'Current user profile returned.',
    type: UserProfileDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @Get('me')
  me(@GetUser() user: { id: number }) {
    return this.authService.me(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user and invalidate refresh token' })
  @ApiOkResponse({
    description: 'Refresh token invalidated.',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @HttpCode(200)
  @Post('logout')
  logout(@GetUser() user: { id: number }) {
    return this.authService.logout(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for current authenticated user' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({
    description: 'Password changed and refresh token invalidated.',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid password format.' })
  @ApiUnauthorizedResponse({
    description: 'Missing token or current password is incorrect.',
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @Patch('me/password')
  changePassword(
    @GetUser() user: { id: number },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
