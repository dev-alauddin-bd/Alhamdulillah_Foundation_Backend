import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole, UserStatus } from '../user/schemas/user.schema';
import { Project, ProjectStatus, ProjectCategory } from '../project/schemas/project.schema';
import { Payment, PaymentMethod, PaymentStatus, PaymentPurpose } from '../payment/schemas/payment.schema';
import { Management } from '../management/schemas/management.schema';
import { FundTransaction, TransactionType } from '../fund/schemas/fund-transaction.schema';
import { ExpenseRequest, ExpenseRequestStatus } from '../fund/schemas/expense-request.schema';
import { Banner } from '../banner/schemas/banner.schema';
import { Notice } from '../notice/schemas/notice.schemas';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const projectModel = app.get<Model<Project>>(getModelToken(Project.name));
  const paymentModel = app.get<Model<Payment>>(getModelToken(Payment.name));
  const managementModel = app.get<Model<Management>>(getModelToken(Management.name));
  const fundTransactionModel = app.get<Model<FundTransaction>>(getModelToken(FundTransaction.name));
  const expenseRequestModel = app.get<Model<ExpenseRequest>>(getModelToken(ExpenseRequest.name));
  const bannerModel = app.get<Model<Banner>>(getModelToken(Banner.name));
  const noticeModel = app.get<Model<Notice>>(getModelToken(Notice.name));

  try {
    console.log('--- Database Seeding Started ---');

    // 1. Clear Existing Data
    console.log('Cleaning existing data...');
    await userModel.deleteMany({});
    await projectModel.deleteMany({});
    await paymentModel.deleteMany({});
    await managementModel.deleteMany({});
    await fundTransactionModel.deleteMany({});
    await expenseRequestModel.deleteMany({});
    await bannerModel.deleteMany({});
    await noticeModel.deleteMany({});
    console.log('✔ Database cleaned.');

    // 2. Seed Users
    console.log('Seeding Users...');
    const usersData = [
      {
        name: 'Super Admin',
        email: 'super1@gmail.com',
        password: '123456',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        phone: '01700000001',
        designation: 'Founder & CEO',
      },
      {
        name: 'Regular Admin',
        email: 'admin@gmail.com',
        password: '123456',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        phone: '01700000002',
        designation: 'Administrator',
      },
      {
        name: 'Regular Member',
        email: 'member@gmail.com',
        password: '123456',
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
        phone: '01700000003',
        designation: 'Board Member',
      },
      {
        name: 'General User',
        email: 'user@gmail.com',
        password: '123456',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        phone: '01700000004',
      },
    ];

    const seededUsers: any[] = [];
    for (const userData of usersData) {
      const user = new userModel(userData);
      await user.save();
      seededUsers.push(user);
    }
    console.log('✔ Users seeded successfully!');

    const superAdminUser = seededUsers.find((u) => u.role === UserRole.SUPER_ADMIN)!;
    const regularAdminUser = seededUsers.find((u) => u.role === UserRole.ADMIN)!;
    const regularMemberUser = seededUsers.find((u) => u.role === UserRole.MEMBER)!;
    const generalUserUser = seededUsers.find((u) => u.role === UserRole.USER)!;

    // 3. Seed Projects
    console.log('Seeding Projects...');
    const projectsData = [
      {
        name: 'অনাথ শিশুদের জন্য বাসস্থান',
        thumbnail: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80',
        description: 'আমরা একটি এতিমখানা তৈরি করছি যেখানে ১০০ জন শিশুর থাকার ব্যবস্থা থাকবে।',
        images: [],
        startDate: new Date(),
        initialInvestment: 50000,
        memberCount: 2,
        category: ProjectCategory.SADAKAH,
        status: ProjectStatus.ACTIVE,
        location: 'ঢাকা, বাংলাদেশ',
        contactNumber: '01700000000',
        createdBy: superAdminUser._id,
        totalInvestment: 150000,
      },
      {
        name: 'রমজানে ইফতার বিতরণ',
        thumbnail: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80',
        description: 'অসহায় মানুষদের মাঝে মাসব্যাপী ইফতার বিতরণের উদ্যোগ।',
        images: [],
        startDate: new Date(),
        initialInvestment: 10000,
        memberCount: 1,
        category: ProjectCategory.RAMADAN,
        status: ProjectStatus.ACTIVE,
        location: 'চট্টগ্রাম, বাংলাদেশ',
        contactNumber: '01800000000',
        createdBy: superAdminUser._id,
        totalInvestment: 85000,
      },
      {
        name: 'বিশুদ্ধ পানির জন্য টিউবওয়েল',
        thumbnail: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80',
        description: 'বন্যা কবলিত এলাকায় সুপেয় পানির অভাব দূর করতে টিউবওয়েল স্থাপন।',
        images: [],
        startDate: new Date(),
        initialInvestment: 20000,
        memberCount: 0,
        category: ProjectCategory.SADAKAH,
        status: ProjectStatus.ONGOING,
        location: 'সিলেট, বাংলাদেশ',
        contactNumber: '01900000000',
        createdBy: superAdminUser._id,
        totalInvestment: 50000,
      },
      {
        name: 'বন্যা পুনর্বাসন প্রকল্প',
        thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80',
        description: 'বন্যায় ক্ষতিগ্রস্ত বাড়িঘর মেরামত এবং নতুন ঘর তৈরি।',
        images: [],
        startDate: new Date('2026-06-01'),
        initialInvestment: 0,
        memberCount: 0,
        category: ProjectCategory.EMERGENCY,
        status: ProjectStatus.UPCOMING,
        location: 'কুড়িগ্রাম, বাংলাদেশ',
        contactNumber: '01300000000',
        createdBy: superAdminUser._id,
        totalInvestment: 0,
      },
    ];

    for (const projectData of projectsData) {
      await projectModel.create(projectData);
    }
    console.log('✔ Projects seeded successfully!');

    // 4. Seed Banners
    console.log('Seeding Banners...');
    const bannersData = [
      {
        title: 'স্বাবলম্বী বাংলাদেশ প্রজেক্ট',
        description: 'যাকাত ফান্ডের মাধ্যমে অভাবী ও অসহায় পরিবারকে স্বাবলম্বী করা।',
        image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80',
        isActive: true,
        displayOrder: 1,
      },
      {
        title: 'অসহায় শিশুদের পাশে আলহামদুলিল্লাহ ফাউন্ডেশন',
        description: 'আমাদের এতিমখানা প্রজেক্টের জন্য ডোনেশন দিয়ে অংশ নিন।',
        image: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80',
        isActive: true,
        displayOrder: 2,
      },
    ];

    for (const bannerData of bannersData) {
      await bannerModel.create(bannerData);
    }
    console.log('✔ Banners seeded successfully!');

    // 5. Seed Notices
    console.log('Seeding Notices...');
    const noticesData = [
      {
        title: 'বার্ষিক সাধারণ সভা ২০২৪ এর সময়সূচী',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        date: new Date(),
        isActive: true,
        submitBy: superAdminUser._id,
      },
      {
        title: 'নতুন ডোনেশন পলিসি ও নিয়মাবলী',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        date: new Date(),
        isActive: true,
        submitBy: superAdminUser._id,
      },
    ];

    for (const noticeData of noticesData) {
      await noticeModel.create(noticeData);
    }
    console.log('✔ Notices seeded successfully!');

    // 6. Seed Management
    console.log('Seeding Management...');
    const managementData = [
      {
        userId: superAdminUser._id,
        position: 'সভাপতি (President)',
        startAt: new Date(),
        isActive: true,
      },
      {
        userId: regularAdminUser._id,
        position: 'সাধারণ সম্পাদক (General Secretary)',
        startAt: new Date(),
        isActive: true,
      },
      {
        userId: regularMemberUser._id,
        position: 'কোষাধ্যক্ষ (Treasurer)',
        startAt: new Date(),
        isActive: true,
      },
    ];

    for (const managementItem of managementData) {
      await managementModel.create(managementItem);
    }
    console.log('✔ Management seeded successfully!');

    // 7. Seed Payments
    console.log('Seeding Payments...');
    const paymentsData = [
      {
        userId: regularMemberUser._id,
        amount: 1000,
        method: PaymentMethod.BKASH_MANUAL,
        paymentStatus: PaymentStatus.PAID,
        purpose: PaymentPurpose.MEMBERSHIP_FEE,
        transactionId: 'TRX_MBR_12345',
        senderNumber: '01712345678',
        paidAt: new Date(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
      {
        userId: generalUserUser._id,
        amount: 500,
        method: PaymentMethod.SSL_GATEWAY,
        paymentStatus: PaymentStatus.PAID,
        purpose: PaymentPurpose.PROJECT_DONATION,
        transactionId: 'TRX_SSL_54321',
        senderNumber: '',
        paidAt: new Date(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
      {
        userId: generalUserUser._id,
        amount: 200,
        method: PaymentMethod.NAGAD_MANUAL,
        paymentStatus: PaymentStatus.PENDING,
        purpose: PaymentPurpose.MONTHLY_DONATION,
        transactionId: 'TRX_NGD_99999',
        senderNumber: '01812345678',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    ];

    const seededPayments: any[] = [];
    for (const paymentData of paymentsData) {
      const payment = await paymentModel.create(paymentData);
      seededPayments.push(payment);
    }
    console.log('✔ Payments seeded successfully!');

    // 8. Seed Fund Transactions
    console.log('Seeding Fund Transactions...');
    const fundTransactionsData = [
      {
        userId: regularMemberUser._id,
        type: TransactionType.INCOME,
        amount: 1000,
        reason: 'Membership Fee Payment',
        balanceSnapshot: 1000,
        evidenceImages: [],
        transactionId: 'FTX-00001',
        paymentId: seededPayments[0]._id,
      },
      {
        userId: generalUserUser._id,
        type: TransactionType.INCOME,
        amount: 500,
        reason: 'Project Donation',
        balanceSnapshot: 1500,
        evidenceImages: [],
        transactionId: 'FTX-00002',
        paymentId: seededPayments[1]._id,
      },
    ];

    for (const txData of fundTransactionsData) {
      await fundTransactionModel.create(txData);
    }
    console.log('✔ Fund Transactions seeded successfully!');

    // 9. Seed Expense Requests
    console.log('Seeding Expense Requests...');
    const expenseRequestsData = [
      {
        requesterId: regularAdminUser._id,
        amount: 500,
        reason: 'বন্যা পুনর্বাসন অফিসের জন্য খাতা কলম ক্রয়',
        evidenceImages: [],
        status: ExpenseRequestStatus.PENDING,
        approvals: [],
      },
      {
        requesterId: regularAdminUser._id,
        amount: 20000,
        reason: 'শীতবস্ত্র বিতরণ প্রজেক্টের জন্য কম্বল ক্রয়',
        evidenceImages: [],
        status: ExpenseRequestStatus.APPROVED,
        approvals: [superAdminUser._id],
        finalApprovedBy: superAdminUser._id,
      },
    ];

    for (const reqData of expenseRequestsData) {
      await expenseRequestModel.create(reqData);
    }
    console.log('✔ Expense Requests seeded successfully!');

    console.log('--- Database Seeding Completed ---');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
    process.exit();
  }
}

bootstrap();
