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

  it('updates an existing user profile', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 7 });
    prisma.user.update.mockResolvedValue({
      id: 7,
      email: 'user@example.com',
      firstName: 'John',
      secondName: 'Doe',
      phoneNumber: '+15551234567',
      address: '221B Baker Street, London',
      role: 'USER',
      createdAt: new Date('2026-03-24T12:00:00.000Z'),
    });

    await expect(
      service.updateProfile(7, {
        firstName: 'John',
        secondName: 'Doe',
        phoneNumber: '+15551234567',
        address: '221B Baker Street, London',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 7,
        firstName: 'John',
        secondName: 'Doe',
      }),
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        firstName: 'John',
        secondName: 'Doe',
        phoneNumber: '+15551234567',
        address: '221B Baker Street, London',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        secondName: true,
        phoneNumber: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });
  });

  it('creates a user with profile fields during registration', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 11,
      email: 'user@example.com',
      role: 'USER',
    });
    prisma.user.update.mockResolvedValue({});
    const signAsync = (
      (service as unknown as { jwt: { signAsync: jest.Mock } }).jwt.signAsync
    );
    signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce(
      'refresh-token',
    );

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'strongPassword123',
        firstName: 'John',
        secondName: 'Doe',
        phoneNumber: '+15551234567',
        address: '221B Baker Street, London',
      }),
    ).resolves.toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'user@example.com',
        firstName: 'John',
        secondName: 'Doe',
        phoneNumber: '+15551234567',
        address: '221B Baker Street, London',
        role: 'USER',
      }),
    });
  });
});
