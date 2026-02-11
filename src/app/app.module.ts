import { Module } from '@nestjs/common';
import { InfraModule } from 'src/infra/infra.module';
import { UseCase } from './usecases.app';
import { XlsxService } from './xlsx.service';

@Module({
  imports: [InfraModule],
  providers: [XlsxService, UseCase],
  exports: [UseCase],
})
export class AppModule {}
