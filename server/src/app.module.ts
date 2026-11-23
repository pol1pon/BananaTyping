import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { TextsModule } from './texts/texts.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    UsersModule,
    TextsModule,
    LeaderboardsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
