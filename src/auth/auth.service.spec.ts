import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deletes an existing user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 5 });
    prisma.user.delete.mockResolvedValue({ id: 5 });

    await expect(service.deleteUser(5)).resolves.toEqual({
      message: 'User deleted successfully',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { id: true },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 5 },
    });
  });
});
