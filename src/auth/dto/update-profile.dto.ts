import { PartialType, PickType } from '@nestjs/swagger';
import { RegisterDto } from './register.dto';

export class UpdateProfileDto extends PartialType(
  PickType(RegisterDto, [
    'firstName',
    'secondName',
    'phoneNumber',
    'address',
  ] as const),
) {}
