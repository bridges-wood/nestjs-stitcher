import { Injectable } from '@nestjs/common';

interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
    { id: '3', name: 'Charlie Brown', email: 'charlie@example.com' },
  ];

  private nextId = 4;

  findAll(): User[] {
    return this.users;
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  create(name: string, email: string): User {
    const user: User = { id: String(this.nextId++), name, email };
    this.users.push(user);
    return user;
  }
}
