import { Module } from '@nestjs/common';
import { ErrorFormatterModule } from './error-formatter.module.js';

@Module({
  imports: [ErrorFormatterModule],
  exports: [ErrorFormatterModule],
})
export class ErrorsModule {}
