import { Module } from '@nestjs/common';
import { AppModule } from 'src/app/app.module';
import { Controllers } from './controller';

@Module({
  imports: [AppModule],
  controllers: [Controllers],
})
export class InterfaceModule {}
