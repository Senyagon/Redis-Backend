import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new product' })
    @ApiResponse({ status: 201, description: 'Product created successfully.' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @Post()
    create(
        @Body() dto: CreateProductDto,
        @GetUser() user: any,
    ) {
        console.log('Current user:', user);
        return this.productService.create(dto);
    }

    @ApiOperation({ summary: 'Retrieve paginated list of products' })
    @ApiResponse({ status: 200, description: 'List of products returned.' })
    @Get()
    findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.productService.findAll(Number(page), Number(limit));
    }

    @ApiOperation({ summary: 'Get product by ID' })
    @ApiResponse({ status: 200, description: 'Product found.' })
    @ApiResponse({ status: 404, description: 'Product not found.' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productService.findOne(Number(id));
    }

    @ApiOperation({ summary: 'Delete product by ID' })
    @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Product not found.' })
    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.productService.delete(Number(id));
    }
}