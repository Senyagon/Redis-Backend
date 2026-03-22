import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Get all categories' })
  @ApiOkResponse({
    description: 'List of categories returned.',
    type: CategoryResponseDto,
    isArray: true,
  })
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @ApiOperation({ summary: 'Get category by ID' })
  @ApiOkResponse({
    description: 'Category found.',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid category id.' })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  @ApiParam({ name: 'id', example: 1 })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @ApiOperation({ summary: 'Get category by slug' })
  @ApiOkResponse({
    description: 'Category found by slug.',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid slug value.' })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  @ApiParam({ name: 'slug', example: 'seeds' })
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (admin only)' })
  @ApiCreatedResponse({
    description: 'Category created successfully.',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiConflictResponse({ description: 'Category slug already exists.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiForbiddenResponse({ description: 'Admin role required.' })
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category by ID (admin only)' })
  @ApiOkResponse({
    description: 'Category updated successfully.',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid category id or request body.' })
  @ApiConflictResponse({ description: 'Category slug already exists.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiForbiddenResponse({ description: 'Admin role required.' })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category by ID (admin only)' })
  @ApiOkResponse({
    description: 'Category deleted successfully.',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid category id.' })
  @ApiConflictResponse({
    description: 'Category cannot be deleted while products are attached to it.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiForbiddenResponse({ description: 'Admin role required.' })
  @ApiNotFoundResponse({ description: 'Category not found.' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
