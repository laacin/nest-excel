import { Module } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { InfraModule } from './infra/infra.module';
import { InterfaceModule } from './interface/interface.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InfraModule,
    AppModule,
    InterfaceModule,
  ],
  controllers: [],
  providers: [],
})
export class MainModule {}
