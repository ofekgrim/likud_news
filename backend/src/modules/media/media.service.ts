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
import { Media } from './entities/media.entity';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';

@Injectable()
export class MediaService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cloudfrontDomain: string;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId'),
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey'),
      },
    });
    this.bucket = this.configService.get<string>('aws.s3Bucket');
    this.cloudfrontDomain = this.configService.get<string>('aws.cloudfrontDomain');
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
