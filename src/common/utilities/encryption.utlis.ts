import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly algorithm = 'aes-256-cbc';
  private key: Buffer;
  private iv: Buffer;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
    const ivHex = this.configService.get<string>('ENCRYPTION_IV');
    if (keyHex.length !== 64 || ivHex.length !== 32) {
      throw new Error('Invalid key or IV length');
    }
    this.key = Buffer.from(keyHex, 'hex');
    this.iv = Buffer.from(ivHex, 'hex');
  }

  encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedText: string): string {
    Logger.log("algo:", this.algorithm);
    Logger.log("key:", this.key);
    Logger.log("iv:", this.iv);
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
    const ivHex = this.configService.get<string>('ENCRYPTION_IV');
    Logger.log("keyHex:", keyHex);
    Logger.log("ivHex:", ivHex);
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
