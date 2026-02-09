import { Module } from '@nestjs/common';
import { AppModule } from 'src/app/app.module';
import { XlsxController } from './controller';

@Module({
  imports: [AppModule],
  controllers: [XlsxController],
})
export class InterfaceModule {}
