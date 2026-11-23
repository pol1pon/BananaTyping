import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Text } from '../database/entities/text.entity';
import { TextsService } from './texts.service';
import { TextsController } from './texts.controller';
import { AiTextService } from './ai-text.service';

@Module({
  imports: [TypeOrmModule.forFeature([Text])],
  controllers: [TextsController],
  providers: [TextsService, AiTextService],
  exports: [TextsService, AiTextService],
})
export class TextsModule {}
