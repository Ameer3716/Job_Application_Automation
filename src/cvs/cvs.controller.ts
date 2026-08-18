import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvsService } from './cvs.service';
import { CreateCvDto, UpdateCvDto } from './dto/create-cv.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('cvs')
@UseGuards(AuthGuard('jwt'))
export class CvsController {
  constructor(private readonly cvsService: CvsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/cvs',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `cv-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
          return callback(new Error('Only PDF and Word documents are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  create(@Body() createCvDto: CreateCvDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createCvDto.fileName = file.originalname;
      createCvDto.filePath = file.path;
    }
    return this.cvsService.create(createCvDto);
  }

  @Get()
  findAll() {
    return this.cvsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cvsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCvDto: UpdateCvDto) {
    return this.cvsService.update(id, updateCvDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cvsService.remove(id);
  }

  @Post('match')
  findBestMatch(@Body() body: { jobDescription: string; requiredSkills?: string }) {
    return this.cvsService.findBestMatch(body.jobDescription, body.requiredSkills);
  }
}
