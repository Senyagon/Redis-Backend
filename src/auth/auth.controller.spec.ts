import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            me: jest.fn(),
            logout: jest.fn(),
            deleteUser: jest.fn(),
            updateProfile: jest.fn(),
            changePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates deleteMe to authService.deleteUser', () => {
    const authService = moduleRefAuthService(controller);
    controller.deleteMe({ id: 7 });

    expect(authService.deleteUser).toHaveBeenCalledWith(7);
  });

  it('delegates register to authService.register with the full dto', () => {
    const authService = moduleRefAuthService(controller);
    const dto = {
      email: 'user@example.com',
      password: 'strongPassword123',
      firstName: 'John',
      secondName: 'Doe',
      phoneNumber: '+15551234567',
      address: '221B Baker Street, London',
    };

    controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('delegates updateProfile to authService.updateProfile', () => {
    const authService = moduleRefAuthService(controller);
    const dto = {
      firstName: 'John',
      secondName: 'Doe',
      phoneNumber: '+15551234567',
      address: '221B Baker Street, London',
    };

    controller.updateProfile({ id: 9 }, dto);

    expect(authService.updateProfile).toHaveBeenCalledWith(9, dto);
  });
});

function moduleRefAuthService(controller: AuthController): jest.Mocked<AuthService> {
  return (controller as unknown as { authService: jest.Mocked<AuthService> })
    .authService;
}
