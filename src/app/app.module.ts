import { Module } from '@nestjs/common';
import { XlsxService } from './xlsx.service';
import { XlsxUseCase } from './usecases.app';
import { InfraModule } from 'src/infra/infra.module';

@Module({
  imports: [InfraModule],
  providers: [XlsxService, XlsxUseCase],
  exports: [XlsxUseCase],
})
export class AppModule {}
