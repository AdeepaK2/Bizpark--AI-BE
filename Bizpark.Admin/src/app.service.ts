import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Bizpark Admin</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; }
            a { color: #0f62fe; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>Bizpark Admin</h1>
          <p><a href="/admin/templates">Open Template Manager</a></p>
        </body>
      </html>
    `;
  }
}
