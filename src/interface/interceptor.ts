import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

export const UPLOAD_DIR: string = join(process.cwd(), 'tmp');

export function FileIntr() {
  return UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  );
}
