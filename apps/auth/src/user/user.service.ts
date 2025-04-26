import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  Users,
  PaginationDto,
} from '@app/common';
import { randomUUID } from 'crypto';
import { Observable, Subject } from 'rxjs';

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
}
