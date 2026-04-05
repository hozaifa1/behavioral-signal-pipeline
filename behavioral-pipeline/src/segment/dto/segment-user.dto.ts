import { IsString } from 'class-validator';

export class SegmentUserDto {
  @IsString()
  userId: string;
}
