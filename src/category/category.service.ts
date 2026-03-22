import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    await this.ensureSlugAvailable(dto.slug);

    try {
      return await this.prisma.category.create({
        data: dto,
      });
    } catch (error) {
      this.handleCategoryWriteError(error);
    }
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.ensureExists(id);

    if (dto.slug) {
      await this.ensureSlugAvailable(dto.slug, id);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      this.handleCategoryWriteError(error);
    }
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.ensureNoProductsAttached(id);

    try {
      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      this.handleCategoryWriteError(error);
    }
  }

  private async ensureExists(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async ensureSlugAvailable(slug: string, ignoreId?: number) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory && existingCategory.id !== ignoreId) {
      throw new ConflictException('Category slug already exists');
    }
  }

  private async ensureNoProductsAttached(categoryId: number) {
    const productsCount = await this.prisma.product.count({
      where: { categoryId },
    });

    if (productsCount > 0) {
      throw new ConflictException(
        'Category cannot be deleted while products are attached to it',
      );
    }
  }

  private handleCategoryWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category slug already exists');
      }

      if (error.code === 'P2003') {
        throw new ConflictException(
          'Category cannot be deleted while products are attached to it',
        );
      }
    }

    throw error;
  }
}
