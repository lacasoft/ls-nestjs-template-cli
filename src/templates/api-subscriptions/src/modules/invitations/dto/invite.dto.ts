import { IsEmail, IsUUID, IsNotEmpty } from 'class-validator';

export class InviteDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}
