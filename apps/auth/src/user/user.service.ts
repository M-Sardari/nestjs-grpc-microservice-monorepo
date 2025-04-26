import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  Users,
  PaginationDto,
  ExcelFile,
} from '@app/common';
import { randomUUID } from 'crypto';
import { Observable, Subject } from 'rxjs';
import * as ExcelJS from 'exceljs';
import * as Fs from 'fs';
import { PassThrough } from 'stream'; // const fs = require('fs');

@Injectable()
export class UserService implements OnModuleInit {
  private readonly users: User[] = [];

  onModuleInit() {
    for (let i = 0; i <= 200000; i++) {
      this.create({
        username: randomUUID(),
        password: randomUUID(),
        age: '0',
      });
    }
  }

  create(createUserDto: CreateUserDto): User {
    const user: User = {
      ...createUserDto,
      id: randomUUID(),
      subscribed: false,
      socialMedia: {},
    };

    this.users.push(user);
    return user;
  }

  findAll(): Users {
    return { users: this.users };
  }

  findOne(id: string) {
    return this.users.find((user) => user.id === id);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        ...updateUserDto,
      };
      return this.users[userIndex];
    }
    throw new NotFoundException(`User with id ${id} not found`);
  }

  remove(id: string) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
      return this.users.splice(userIndex)[0];
    }
    throw new NotFoundException(`User with id ${id} not found`);
  }

  queryUsers(
    paginationDtoStream: Observable<PaginationDto>,
  ): Observable<Users> {
    const subject = new Subject<Users>();
    const onNext = (paginationDto: PaginationDto) => {
      // const { page, skip } = paginationDto;
      const start = paginationDto.page * paginationDto.skip;
      subject.next({
        users: this.users.slice(start, start + paginationDto.skip),
      });
    };

    const onComplete = () => subject.complete();
    paginationDtoStream.subscribe({
      next: onNext,
      complete: onComplete,
    });
    return subject.asObservable();
  }

  generateExcel(): Observable<ExcelFile> {
    return new Observable((observer) => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Username', key: 'username', width: 36 },
        { header: 'Password', key: 'password', width: 36 },
        { header: 'Age', key: 'age', width: 10 },
        { header: 'Subscribed', key: 'subscribed', width: 15 },
        { header: 'SocialMedia', key: 'socialMedia', width: 15 },
      ];

      this.users.forEach((user) => {
        worksheet.addRow(user);
      });

      // ایجاد یک فایل موقت در حافظه
      const tempFilePath = './exports/temp_users.xlsx';
      const stream = Fs.createWriteStream(tempFilePath);

      // نوشتن فایل و ارسال پاسخ
      workbook.xlsx
        .write(stream)
        .then(() => {
          // خواندن فایل ایجاد شده و ارسال آن
          Fs.readFile(tempFilePath, (err, data) => {
            if (err) {
              observer.error(err);
              return;
            }

            observer.next({ data: Buffer.from(data) });
            observer.complete();

            // حذف فایل موقت پس از ارسال (اختیاری)
            // Fs.unlink(tempFilePath, (unlinkErr) => {
            // if (unlinkErr)
            // console.error('Error deleting temp file:', unlinkErr);
            // });
          });
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  // generateExcel(): Observable<ExcelFile> {
  //   return new Observable((observer) => {
  //     try {
  //       const workbook = new ExcelJS.Workbook();
  //       const worksheet = workbook.addWorksheet('Users');

  //       worksheet.columns = [
  //         { header: 'ID', key: 'id', width: 36 },
  //         { header: 'Username', key: 'username', width: 36 },
  //         { header: 'Password', key: 'password', width: 36 },
  //         { header: 'Age', key: 'age', width: 10 },
  //         { header: 'Subscribed', key: 'subscribed', width: 15 },
  //         { header: 'SocialMedia', key: 'socialMedia', width: 15 },
  //       ];

  //       this.users.forEach((user) => {
  //         worksheet.addRow(user);
  //       });

  //       const passThrough = new PassThrough();
  //       const chunks: Buffer[] = [];

  //       passThrough.on('data', (chunk) => chunks.push(chunk));
  //       passThrough.on('end', () => {
  //         observer.next({ data: Buffer.concat(chunks) });
  //         observer.complete();
  //       });
  //       passThrough.on('error', (error) => observer.error(error));

  //       workbook.xlsx
  //         .write(passThrough)
  //         .catch((error) => observer.error(error));
  //     } catch (error) {
  //       observer.error(error);
  //     }
  //   });
  // }
}
