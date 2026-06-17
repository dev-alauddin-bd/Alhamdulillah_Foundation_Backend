import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { FundModule } from '../fund/fund.module';
import { Project, ProjectSchema } from './schemas/project.schema';

@Module({
  imports: [
    FundModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
