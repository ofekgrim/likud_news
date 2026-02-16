import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushToken } from './entities/push-token.entity';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly pushTokenRepository: Repository<PushToken>,
  ) {}

  async registerToken(registerTokenDto: RegisterTokenDto): Promise<PushToken> {
    const existing = await this.pushTokenRepository.findOne({
      where: { deviceId: registerTokenDto.deviceId },
    });

    if (existing) {
      existing.token = registerTokenDto.token;
      existing.platform = registerTokenDto.platform;
      existing.isActive = true;
      return this.pushTokenRepository.save(existing);
    }

    const pushToken = this.pushTokenRepository.create(registerTokenDto);
    return this.pushTokenRepository.save(pushToken);
  }

  async sendToAll(
    sendNotificationDto: SendNotificationDto,
  ): Promise<{ sent: number }> {
    const activeTokens = await this.pushTokenRepository.find({
      where: { isActive: true },
    });

    this.logger.log(
      `Sending notification to ${activeTokens.length} devices: "${sendNotificationDto.title}"`,
    );

    // TODO: Integrate Firebase Admin SDK to send push notifications
    // For each token, send via firebase-admin messaging:
    //
    // const message = {
    //   notification: {
    //     title: sendNotificationDto.title,
    //     body: sendNotificationDto.body,
    //     ...(sendNotificationDto.imageUrl && { imageUrl: sendNotificationDto.imageUrl }),
    //   },
    //   data: sendNotificationDto.data ? { ...sendNotificationDto.data } : undefined,
    //   token: token.token,
    // };
    // await admin.messaging().send(message);

    return { sent: activeTokens.length };
  }

  async deactivateToken(deviceId: string): Promise<void> {
    await this.pushTokenRepository.update(
      { deviceId },
      { isActive: false },
    );
  }
}
