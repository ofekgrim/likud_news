import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { Media, MediaType } from './entities/media.entity';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';

@Injectable()
export class MediaService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cloudfrontDomain: string;
  private readonly uploadsDir: string;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region') ?? 'eu-west-1',
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId') ?? '',
        secretAccessKey:
          this.configService.get<string>('aws.secretAccessKey') ?? '',
      },
    });
    this.bucket =
      this.configService.get<string>('aws.s3Bucket') ?? 'likud-news-media';
    this.cloudfrontDomain =
      this.configService.get<string>('aws.cloudfrontDomain') ?? '';
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generatePresignedUrl(
    presignUploadDto: PresignUploadDto,
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    const { filename, mimeType } = presignUploadDto;
    const extension = filename.split('.').pop();
    const s3Key = `media/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    return { uploadUrl, s3Key };
  }

  async confirmUpload(confirmUploadDto: ConfirmUploadDto): Promise<Media> {
    const url = this.cloudfrontDomain
      ? `https://${this.cloudfrontDomain}/${confirmUploadDto.s3Key}`
      : `https://${this.bucket}.s3.amazonaws.com/${confirmUploadDto.s3Key}`;

    const media = this.mediaRepository.create({
      ...confirmUploadDto,
      url,
    });

    return this.mediaRepository.save(media);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Media[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.mediaRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async uploadLocal(
    file: Express.Multer.File,
  ): Promise<Media> {
    const ext = path.extname(file.originalname);
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const dir = path.join(this.uploadsDir, String(year), month);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const s3Key = `uploads/${year}/${month}/${filename}`;
    const port = this.configService.get<number>('port', 6000);
    const url = `http://localhost:${port}/${s3Key}`;

    const extLower = ext.replace('.', '').toLowerCase();
    const typeMap: Record<string, MediaType> = {
      jpg: MediaType.IMAGE, jpeg: MediaType.IMAGE, png: MediaType.IMAGE,
      gif: MediaType.IMAGE, webp: MediaType.IMAGE, svg: MediaType.IMAGE,
      mp4: MediaType.VIDEO, webm: MediaType.VIDEO, mov: MediaType.VIDEO,
      mp3: MediaType.AUDIO, wav: MediaType.AUDIO, ogg: MediaType.AUDIO,
    };
    const mediaType = typeMap[extLower] || MediaType.DOCUMENT;

    const media = this.mediaRepository.create({
      filename: file.originalname,
      url,
      s3Key,
      type: mediaType,
      mimeType: file.mimetype,
      size: file.size,
    });

    return this.mediaRepository.save(media);
  }

  async deleteMedia(id: string): Promise<void> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID "${id}" not found`);
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: media.s3Key,
      });
      await this.s3Client.send(command);
    } catch {
      // Log but don't fail if S3 deletion fails
    }

    await this.mediaRepository.remove(media);
  }
}
