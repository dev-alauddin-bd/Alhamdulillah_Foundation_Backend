import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { UserRole, UserStatus } from '../user/schemas/user.schema';
import { ProjectService } from '../project/project.service';
import { ProjectStatus, ProjectCategory } from '../project/schemas/project.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);
  const projectService = app.get(ProjectService);

  const userModel = (userService as any).userModel;
  const projectModel = (projectService as any).projectModel;

  try {
    console.log('--- Database Seeding Started ---');

    // 1. Seed Users
    console.log('Seeding Users...');
    await userModel.deleteMany({}); // Clear existing users

    const users = [
      {
        name: 'Super Admin',
        email: 'super1@gmail.com',
        password: '123456',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        name: 'Regular Member',
        email: 'member@gmail.com',
        password: '123456',
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
      },
      {
        name: 'General User',
        email: 'user@gmail.com',
        password: '123456',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    ];

    for (const userData of users) {
      const user = new userModel(userData);
      await user.save();
    }
    console.log('✔ Users seeded successfully!');

    const adminUser = await userModel.findOne({ role: UserRole.SUPER_ADMIN });

    // 2. Seed Projects
    console.log('Seeding Projects...');
    await projectModel.deleteMany({}); // Clear existing projects

    const projects = [
      {
        name: 'অনাথ শিশুদের জন্য বাসস্থান',
        description: 'আমরা একটি এতিমখানা তৈরি করছি যেখানে ১০০ জন শিশুর থাকার ব্যবস্থা থাকবে।',
        category: ProjectCategory.SADAKAH,
        goalAmount: 500000,
        raisedAmount: 150000,
        status: ProjectStatus.ACTIVE,
        thumbnail: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80',
        images: [],
        startDate: new Date(),
        initialInvestment: 50000,
        location: 'ঢাকা, বাংলাদেশ',
        contactNumber: '01700000000',
        createdBy: adminUser._id,
      },
      {
        name: 'রমজানে ইফতার বিতরণ',
        description: 'অসহায় মানুষদের মাঝে মাসব্যাপী ইফতার বিতরণের উদ্যোগ।',
        category: ProjectCategory.RAMADAN,
        goalAmount: 100000,
        raisedAmount: 85000,
        status: ProjectStatus.ACTIVE,
        thumbnail: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80',
        images: [],
        startDate: new Date(),
        initialInvestment: 10000,
        location: 'চট্টগ্রাম, বাংলাদেশ',
        contactNumber: '01800000000',
        createdBy: adminUser._id,
      },
      {
        name: 'বিশুদ্ধ পানির জন্য টিউবওয়েল',
        description: 'বন্যা কবলিত এলাকায় সুপেয় পানির অভাব দূর করতে টিউবওয়েল স্থাপন।',
        category: ProjectCategory.SADAKAH,
        goalAmount: 200000,
        raisedAmount: 50000,
        status: ProjectStatus.ONGOING,
        thumbnail: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80',
        images: [],
        startDate: new Date(),
        initialInvestment: 20000,
        location: 'সিলেট, বাংলাদেশ',
        contactNumber: '01900000000',
        createdBy: adminUser._id,
      },
      {
        name: 'শীতবস্ত্র বিতরণ ২০২৪',
        description: 'উত্তরাঞ্চলের শীতার্ত মানুষদের মাঝে কম্বল এবং গরম কাপড় বিতরণ।',
        category: ProjectCategory.SADAKAH,
        goalAmount: 150000,
        raisedAmount: 150000,
        status: ProjectStatus.EXPIRED,
        thumbnail: 'https://images.unsplash.com/photo-1544654803-b69110bb2894?auto=format&fit=crop&q=80',
        images: [],
        startDate: new Date('2024-01-01'),
        initialInvestment: 15000,
        location: 'রংপুর, বাংলাদেশ',
        contactNumber: '01600000000',
        createdBy: adminUser._id,
      },
      {
        name: 'যাকাত ভিত্তিক কর্মসংস্থান',
        description: 'বিধবা এবং অসহায় নারীদের সেলাই মেশিন প্রদান করে স্বাবলম্বী করা।',
        category: ProjectCategory.ZAKAT,
        goalAmount: 300000,
        raisedAmount: 120000,
        status: ProjectStatus.ACTIVE,
        thumbnail: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80',
        images: [],
        startDate: new Date(),
        initialInvestment: 30000,
        location: 'রাজশাহী, বাংলাদেশ',
        contactNumber: '01500000000',
        createdBy: adminUser._id,
      },
      {
        name: 'জরুরী চিকিৎসা সহায়তা',
        description: 'আকস্মিক দুর্ঘটনায় আহত বা গুরুতর অসুস্থ ব্যক্তিদের চিকিৎসার খরচ প্রদান।',
        category: ProjectCategory.EMERGENCY,
        goalAmount: 1000000,
        raisedAmount: 450000,
        status: ProjectStatus.ACTIVE,
        thumbnail: 'https://images.unsplash.com/photo-1538108197017-c1a966b39429?auto=format&fit=crop&q=80',
        images: [],
        startDate: new Date(),
        initialInvestment: 100000,
        location: 'সারাদেশ, বাংলাদেশ',
        contactNumber: '01400000000',
        createdBy: adminUser._id,
      },
      {
        name: 'বন্যা পুনর্বাসন প্রকল্প',
        description: 'বন্যায় ক্ষতিগ্রস্ত বাড়িঘর মেরামত এবং নতুন ঘর তৈরি।',
        category: ProjectCategory.EMERGENCY,
        goalAmount: 2000000,
        raisedAmount: 0,
        status: ProjectStatus.UPCOMING,
        thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80',
        images: [],
        startDate: new Date('2024-06-01'),
        initialInvestment: 0,
        location: 'কুড়িগ্রাম, বাংলাদেশ',
        contactNumber: '01300000000',
        createdBy: adminUser._id,
      },
      {
        name: 'মসজিদ সংস্কার প্রজেক্ট',
        description: 'গ্রামীন এলাকায় জরাজীর্ণ মসজিদ মেরামত ও ওযুখানা তৈরি।',
        category: ProjectCategory.SADAKAH,
        goalAmount: 400000,
        raisedAmount: 300000,
        status: ProjectStatus.ONGOING,
        thumbnail: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80',
        images: [],
        startDate: new Date(),
        initialInvestment: 40000,
        location: 'খুলনা, বাংলাদেশ',
        contactNumber: '01200000000',
        createdBy: adminUser._id,
      },
      {
        name: 'শিক্ষা উপবৃত্তি প্রকল্প',
        description: 'গরীব মেধাবী ছাত্র-ছাত্রীদের বই এবং টিউশন ফি প্রদান।',
        category: ProjectCategory.SADAKAH,
        goalAmount: 250000,
        raisedAmount: 200000,
        status: ProjectStatus.ACTIVE,
        thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80',
        images: [],
        startDate: new Date(),
        initialInvestment: 25000,
        location: 'বরিশাল, বাংলাদেশ',
        contactNumber: '01100000000',
        createdBy: adminUser._id,
      },
    ];

    for (const projectData of projects) {
       await projectModel.create(projectData);
    }
    console.log('✔ 9 Projects seeded successfully!');

    console.log('--- Database Seeding Completed ---');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
    process.exit();
  }
}

bootstrap();
