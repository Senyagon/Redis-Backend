import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) { }

    create(data: CreateProductDto) {
        return this.prisma.product.create({ data });
    }

    findAll(page = 1, limit = 10) {
        return this.prisma.product.findMany({
            skip: (page - 1) * limit,
            take: limit,
            include: { category: true },
        });
    }

    findOne(id: number) {
        return this.prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });
    }

    delete(id: number) {
        return this.prisma.product.delete({
            where: { id },
        });
    }
}