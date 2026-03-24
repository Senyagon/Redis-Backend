import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Patch,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto';
import { ProductSearchSuggestionDto } from './dto/product-search-suggestion.dto';

const productImageInterceptor = FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ➕ Create product
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product with an optional image upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Create a product. If an image file is provided, it is uploaded and linked to the new product automatically.',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Tomato Seeds',
        },
        slug: {
          type: 'string',
          example: 'tomato-seeds',
        },
        price: {
          type: 'integer',
          example: 100,
        },
        categoryId: {
          type: 'integer',
          example: 1,
        },
        description: {
          type: 'string',
          example: 'Best seeds for your garden',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['name', 'slug', 'price', 'categoryId'],
    },
  })
  @ApiCreatedResponse({
    description: 'Product created successfully.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed, invalid categoryId, or invalid image file.',
  })
  @ApiConflictResponse({ description: 'Product slug already exists.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @Post()
  @UseInterceptors(productImageInterceptor)
  create(
    @Body() dto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @GetUser() user: { id: number; email: string; role: string },
  ) {
    void user;
    const createDto: CreateProductDto = {
      ...dto,
      image: file ? `/uploads/${file.filename}` : dto.image,
    };

    return this.productService.create(createDto).catch(async (error: unknown) => {
      if (file) {
        await this.deleteUploadedFile(file.path);
      }

      throw error;
    });
  }

  // 📦 Get all products (pagination)
  @ApiOperation({ summary: 'Retrieve paginated list of products' })
  @ApiOkResponse({
    description: 'Paginated list of products returned.',
    type: PaginatedProductsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiBadRequestResponse({ description: 'Invalid pagination parameters.' })
  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.productService.findAll(Number(page), Number(limit));
  }

  @ApiOperation({ summary: 'Search products by name' })
  @ApiOkResponse({
    description: 'Products matching the name query returned.',
    type: ProductResponseDto,
    isArray: true,
  })
  @ApiQuery({
    name: 'name',
    required: true,
    example: 'Tomato Seeds',
    description: 'Product name or part of the product name.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiBadRequestResponse({
    description: 'Product name query is required or limit value is invalid.',
  })
  @Get('search')
  searchByName(
    @Query('name') name: string,
    @Query('limit') limit = 10,
  ) {
    return this.productService.searchByName(name, Number(limit));
  }

  @ApiOperation({
    summary: 'Search products by name with typo tolerance using bigrams',
  })
  @ApiOkResponse({
    description: 'Products matching the fuzzy name query returned.',
    type: ProductResponseDto,
    isArray: true,
  })
  @ApiQuery({
    name: 'name',
    required: true,
    example: 'Tomato Seds',
    description: 'Product name query with possible typo.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiBadRequestResponse({
    description: 'Product name query is required or limit value is invalid.',
  })
  @Get('search/fuzzy')
  fuzzySearchByName(
    @Query('name') name: string,
    @Query('limit') limit = 10,
  ) {
    return this.productService.fuzzySearchByName(name, Number(limit));
  }

  @ApiOperation({ summary: 'Get product search suggestions for autocomplete' })
  @ApiOkResponse({
    description: 'Autocomplete suggestions returned.',
    type: ProductSearchSuggestionDto,
    isArray: true,
  })
  @ApiQuery({
    name: 'query',
    required: true,
    example: 'Tom',
    description: 'Part of the product name for autocomplete.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  @ApiBadRequestResponse({
    description: 'Autocomplete query is required or limit value is invalid.',
  })
  @Get('search/suggestions')
  getSearchSuggestions(
    @Query('query') query: string,
    @Query('limit') limit = 5,
  ) {
    return this.productService.getSearchSuggestions(query, Number(limit));
  }

  @ApiOperation({ summary: 'Retrieve latest products' })
  @ApiOkResponse({
    description: 'Latest products returned.',
    type: ProductResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiBadRequestResponse({ description: 'Invalid limit value.' })
  @Get('latest')
  findLatest(@Query('limit') limit = 10) {
    return this.productService.findLatest(Number(limit));
  }

  @ApiOperation({ summary: 'Get product by slug' })
  @ApiOkResponse({
    description: 'Product found by slug.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid slug value.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @ApiParam({ name: 'slug', example: 'tomato-seeds' })
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Get related products from the same category' })
  @ApiOkResponse({
    description: 'Related products returned.',
    type: ProductResponseDto,
    isArray: true,
  })
  @ApiNotFoundResponse({ description: 'Source product not found.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 4 })
  @ApiBadRequestResponse({ description: 'Invalid product id or limit value.' })
  @Get(':id/related')
  findRelated(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit = 4,
  ) {
    return this.productService.findRelated(id, Number(limit));
  }

  // 🔍 Get one product
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({ description: 'Product found.', type: ProductResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid product id.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', example: 1, description: 'Product ID to update.' })
  @ApiBody({
    type: UpdateProductDto,
    description:
      'Update one or more product fields. Only the fields included in the request body will be changed.',
    examples: {
      updatePriceAndDescription: {
        summary: 'Update product price and description',
        value: {
          price: 150,
          description: 'Improved seed mix for spring planting',
        },
      },
      fullProductPatch: {
        summary: 'Update several product fields',
        value: {
          name: 'Tomato Seeds Premium',
          slug: 'tomato-seeds-premium',
          price: 180,
          categoryId: 2,
          description: 'Premium tomato seeds with high germination rate',
          image: '/uploads/tomato-seeds-premium.webp',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Product updated successfully.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed, invalid product id, or categoryId is invalid.',
  })
  @ApiConflictResponse({ description: 'Product slug already exists.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload image and attach it to a specific product' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({
    description: 'Product image updated successfully.',
    type: ProductResponseDto,
  })
  @HttpCode(200)
  @ApiBadRequestResponse({
    description: 'Invalid file type, file too large, or invalid id.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @Post(':id/image')
  @UseInterceptors(productImageInterceptor)
  uploadProductImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.productService.updateImage(id, `/uploads/${file.filename}`);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove image from a specific product' })
  @ApiOkResponse({
    description: 'Product image removed successfully.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid product id.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @Delete(':id/image')
  deleteImage(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteImage(id);
  }

  // ❌ Delete product
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiOkResponse({
    description: 'Product deleted successfully.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid product id.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productService.delete(id);
  }

  private async deleteUploadedFile(filePath: string) {
    try {
      await unlink(filePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
