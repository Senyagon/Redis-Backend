import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(
        @Body() dto: CreateProductDto,
        @GetUser() user: any,
    ) {
        console.log('Current user:', user);
        return this.productService.create(dto);
    }

    @Get()
    findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.productService.findAll(Number(page), Number(limit));
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productService.findOne(Number(id));
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.productService.delete(Number(id));
    }
}