import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsString()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name!: string;
}
