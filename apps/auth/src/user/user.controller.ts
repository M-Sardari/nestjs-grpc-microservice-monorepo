import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import {
  UserServiceController,
  CreateUserDto,
  UpdateUserDto,
  UserServiceControllerMethods,
  FindOneUserDto,
  PaginationDto,
} from '@app/common';
import { Observable } from 'rxjs';

@Controller()
@UserServiceControllerMethods()
export class UserController implements UserServiceController {
  constructor(private readonly userService: UserService) {}

  createUser(createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  findAllUsers() {
    return this.userService.findAll();
  }

  findOneUser(findOneUserDto: FindOneUserDto) {
    return this.userService.findOne(findOneUserDto.id);
  }

  updateUser(updateUserDto: UpdateUserDto) {
    return this.userService.update(updateUserDto.id, updateUserDto);
  }

  removeUser(findOneUserDto: FindOneUserDto) {
    return this.userService.remove(findOneUserDto.id);
  }

  queryUsers(paginationDtoStream: Observable<PaginationDto>) {
    return this.userService.queryUsers(paginationDtoStream);
  }
}
