import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { unlink } from 'fs/promises';
import { basename, join } from 'path';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // ➕ Create product
  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          price: dto.price,
          categoryId: dto.categoryId,
          description: dto.description,
          image: dto.image,
        },
        include: { category: true },
      });
    } catch (error) {
      this.handleProductWriteError(error);
    }
  }

  // 📦 Get all products with pagination
  async findAll(page = 1, limit = 10) {
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findLatest(limit = 10) {
    return this.prisma.product.findMany({
      take: limit,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🔍 Get one product
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findRelated(id: number, limit = 4) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, categoryId: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: limit,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.ensureExists(id);

    try {
      return await this.prisma.product.update({
        where: { id },
        data: dto,
        include: { category: true },
      });
    } catch (error) {
      this.handleProductWriteError(error);
    }
  }

  async updateImage(id: number, image: string) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, image: true },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { image },
      include: { category: true },
    });

    if (existingProduct.image && existingProduct.image !== image) {
      await this.deleteImageFile(existingProduct.image);
    }

    return updatedProduct;
  }

  async deleteImage(id: number) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, image: true },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { image: null },
      include: { category: true },
    });

    if (existingProduct.image) {
      await this.deleteImageFile(existingProduct.image);
    }

    return updatedProduct;
  }

  // ❌ Delete product
  async delete(id: number) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, image: true },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const deletedProduct = await this.prisma.product.delete({
      where: { id },
      include: { category: true },
    });

    if (existingProduct.image) {
      await this.deleteImageFile(existingProduct.image);
    }

    return deletedProduct;
  }

  private async ensureExists(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private handleProductWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product slug already exists');
      }

      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid categoryId');
      }
    }

    throw error;
  }

  private async deleteImageFile(imagePath: string) {
    const fileName = basename(imagePath);
    const absolutePath = join(process.cwd(), 'uploads', fileName);

    try {
      await unlink(absolutePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
