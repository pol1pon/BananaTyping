import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TextsService } from './texts.service';
import { CreateTextDto } from './dto/create-text.dto';
import { UpdateTextDto } from './dto/update-text.dto';
import { GenerateTextDto } from './dto/generate-text.dto';
import { Text } from '../database/entities/text.entity';

@ApiTags('Texts')
@Controller('texts')
export class TextsController {
  constructor(private readonly textsService: TextsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Сгенерировать текст через бесплатную нейросеть и сохранить в SQLite' })
  @ApiBody({ type: GenerateTextDto })
  @ApiResponse({ status: 201, description: 'Текст успешно сгенерирован нейросетью и сохранен в БД', type: Text })
  generate(@Body() generateTextDto: GenerateTextDto): Promise<Text> {
    return this.textsService.generateAndSave(generateTextDto);
  }

  @Get('random')
  @ApiOperation({ summary: 'Получить случайный текст из базы данных (с автогенерацией если база пуста)' })
  @ApiQuery({ name: 'language', required: false, enum: ['ru', 'en'], description: 'Язык текста' })
  @ApiQuery({ name: 'excludeId', required: false, type: Number, description: 'ID текста для исключения из выборки' })
  @ApiResponse({ status: 200, description: 'Случайный текст получен', type: Text })
  getRandom(
    @Query('language') language?: string,
    @Query('excludeId') excludeId?: string,
  ): Promise<Text> {
    return this.textsService.getRandom(language, excludeId ? Number(excludeId) : undefined);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new text manually' })
  @ApiBody({ type: CreateTextDto })
  @ApiResponse({ status: 201, description: 'Text created successfully', type: Text })
  create(@Body() createTextDto: CreateTextDto): Promise<Text> {
    return this.textsService.create(createTextDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all texts' })
  @ApiQuery({ name: 'language', required: false, enum: ['ru', 'en'], description: 'Фильтр по языку' })
  @ApiResponse({ status: 200, description: 'List of all texts', type: [Text] })
  findAll(@Query('language') language?: string): Promise<Text[]> {
    return this.textsService.findAll(language);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get text by ID' })
  @ApiParam({ name: 'id', description: 'Text ID' })
  @ApiResponse({ status: 200, description: 'Text found', type: Text })
  @ApiResponse({ status: 404, description: 'Text not found' })
  findOne(@Param('id') id: string): Promise<Text | null> {
    return this.textsService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update text by ID' })
  @ApiParam({ name: 'id', description: 'Text ID' })
  @ApiBody({ type: UpdateTextDto })
  @ApiResponse({ status: 200, description: 'Text updated successfully', type: Text })
  update(@Param('id') id: string, @Body() updateTextDto: UpdateTextDto): Promise<Text | null> {
    return this.textsService.update(+id, updateTextDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete text by ID' })
  @ApiParam({ name: 'id', description: 'Text ID' })
  @ApiResponse({ status: 200, description: 'Text deleted successfully' })
  remove(@Param('id') id: string): Promise<void> {
    return this.textsService.remove(+id);
  }
}
