import { IsEnum } from 'class-validator';
import { ChatFeedback } from '../entities/chatbot-session.entity';

export class ChatFeedbackDto {
  @IsEnum(ChatFeedback)
  feedback: ChatFeedback;
}
