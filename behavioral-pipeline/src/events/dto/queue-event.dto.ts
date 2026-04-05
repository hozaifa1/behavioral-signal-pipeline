import { IsString, IsNumber, IsOptional } from 'class-validator';

export class QueueEventDto {
  @IsString()
  userId: string;

  @IsString()
  eventType: string;

  @IsNumber()
  @IsOptional()
  scrollDepth: number = 0;

  @IsString()
  pageUrl: string;

  @IsNumber()
  timestamp: number;
}
