import { Module } from '@nestjs/common';
import { USE_CASES } from './usecases';
import { UploadRepository } from '@impler/dal';
import { CommonController } from './common.controller';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [SharedModule, UploadRepository],
  providers: [...USE_CASES],
  controllers: [CommonController],
})
export class CommonModule {}
