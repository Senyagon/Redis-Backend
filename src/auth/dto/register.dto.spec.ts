import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('accepts valid optional profile fields', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'user@example.com',
      password: 'strongPassword123',
      firstName: 'John',
      secondName: "O'Connor",
      phoneNumber: '+15551234567',
      address: '221B Baker Street, London',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid fake-looking profile fields', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'user@example.com',
      password: 'strongPassword123',
      firstName: 'J0hn',
      secondName: '1234',
      phoneNumber: 'abcdef',
      address: 'Somewhere only',
    });

    const errors = await validate(dto);
    const properties = errors.map((error) => error.property);

    expect(properties).toEqual(
      expect.arrayContaining([
        'firstName',
        'secondName',
        'phoneNumber',
        'address',
      ]),
    );
  });

  it('trims incoming string values before validating', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: ' user@example.com ',
      password: ' strongPassword123 ',
      firstName: ' John ',
      secondName: ' Doe ',
      phoneNumber: ' +15551234567 ',
      address: ' 221B Baker Street, London ',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('user@example.com');
    expect(dto.firstName).toBe('John');
    expect(dto.phoneNumber).toBe('+15551234567');
    expect(dto.address).toBe('221B Baker Street, London');
  });
});
