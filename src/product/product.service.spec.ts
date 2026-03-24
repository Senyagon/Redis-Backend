import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw when search query is empty', async () => {
    await expect(service.searchByName('   ')).rejects.toThrow(
      'Product name query is required',
    );
  });

  it('should throw when fuzzy search query is empty', async () => {
    await expect(service.fuzzySearchByName('   ')).rejects.toThrow(
      'Product name query is required',
    );
  });

  it('should throw when autocomplete query is empty', async () => {
    await expect(service.getSearchSuggestions('   ')).rejects.toThrow(
      'Autocomplete query is required',
    );
  });
});
