import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'bizpark-commerce',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
