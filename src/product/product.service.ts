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

  async searchByName(name: string, limit = 10) {
    const normalizedName = this.normalizeSearchText(name);

    if (!normalizedName) {
      throw new BadRequestException('Product name query is required');
    }

    const directMatches = await this.prisma.product.findMany({
      where: {
        name: {
          contains: normalizedName,
          mode: 'insensitive',
        },
      },
      take: limit,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    if (directMatches.length >= limit) {
      return directMatches.slice(0, limit);
    }

    const fuzzyMatches = await this.findFuzzyMatches(normalizedName, limit);
    const combinedResults = new Map<number, (typeof directMatches)[number]>();

    for (const product of directMatches) {
      combinedResults.set(product.id, product);
    }

    for (const product of fuzzyMatches) {
      if (!combinedResults.has(product.id)) {
        combinedResults.set(product.id, product);
      }
    }

    return Array.from(combinedResults.values()).slice(0, limit);
  }

  private async findFuzzyMatches(name: string, limit: number) {
    const products = await this.prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return products
      .map((product) => ({
        product,
        score: this.calculateBigramSimilarity(
          name,
          this.normalizeSearchText(product.name),
        ),
      }))
      .filter(({ score, product }) => {
        const normalizedProductName = this.normalizeSearchText(product.name);

        return (
          normalizedProductName.includes(name) ||
          score >= 0.25
        );
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ product }) => product);
  }

  async getSearchSuggestions(query: string, limit = 5) {
    const normalizedQuery = this.normalizeSearchText(query);

    if (!normalizedQuery) {
      throw new BadRequestException('Autocomplete query is required');
    }

    const products = await this.prisma.product.findMany({
      where: {
        name: {
          contains: normalizedQuery,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
      take: limit * 3,
      orderBy: { createdAt: 'desc' },
    });

    return products
      .sort((left, right) => {
        const leftName = this.normalizeSearchText(left.name);
        const rightName = this.normalizeSearchText(right.name);
        const leftStartsWith = leftName.startsWith(normalizedQuery) ? 1 : 0;
        const rightStartsWith = rightName.startsWith(normalizedQuery) ? 1 : 0;

        if (leftStartsWith !== rightStartsWith) {
          return rightStartsWith - leftStartsWith;
        }

        return leftName.localeCompare(rightName);
      })
      .slice(0, limit);
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

  private normalizeSearchText(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private calculateBigramSimilarity(left: string, right: string) {
    if (!left || !right) {
      return 0;
    }

    if (left === right) {
      return 1;
    }

    const leftBigrams = this.buildBigrams(left);
    const rightBigrams = this.buildBigrams(right);

    if (leftBigrams.length === 0 || rightBigrams.length === 0) {
      return 0;
    }

    const rightCounts = new Map<string, number>();

    for (const bigram of rightBigrams) {
      rightCounts.set(bigram, (rightCounts.get(bigram) ?? 0) + 1);
    }

    let intersection = 0;

    for (const bigram of leftBigrams) {
      const count = rightCounts.get(bigram) ?? 0;

      if (count > 0) {
        intersection += 1;
        rightCounts.set(bigram, count - 1);
      }
    }

    return (2 * intersection) / (leftBigrams.length + rightBigrams.length);
  }

  private buildBigrams(value: string) {
    if (value.length < 2) {
      return [value];
    }

    const bigrams: string[] = [];

    for (let index = 0; index < value.length - 1; index += 1) {
      bigrams.push(value.slice(index, index + 2));
    }

    return bigrams;
  }
}
