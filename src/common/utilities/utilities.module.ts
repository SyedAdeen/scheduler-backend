// utilities.module.ts
import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.utlis';

@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],  // Export the service to make it available in other modules
})
export class UtilitiesModule {}
