import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

export function File({ field, dest }: { field: string; dest: string }) {
  return UseInterceptors(
    FileInterceptor(field, {
      storage: diskStorage({
        destination: dest,
        filename: (_, file, cb) => {
          return cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  );
}
