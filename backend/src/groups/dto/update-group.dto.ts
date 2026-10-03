import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateGroupDto {
  @IsOptional()
  @IsString({ message: 'Group name must be a string' })
  @MinLength(1, { message: 'Group name cannot be empty' })
  @MaxLength(100, { message: 'Group name must be at most 100 characters' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  description?: string;
}
