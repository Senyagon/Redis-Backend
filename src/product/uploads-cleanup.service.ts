import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { readdir, unlink } from 'fs/promises';
import { basename, join } from 'path';

@Injectable()
export class UploadsCleanupService implements OnModuleInit {
  private readonly logger = new Logger(UploadsCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.cleanupOrphanedUploads();
  }

  private async cleanupOrphanedUploads() {
    const uploadsDir = join(process.cwd(), 'uploads');
    const referencedImages = await this.prisma.product.findMany({
      where: {
        image: {
          not: null,
        },
      },
      select: {
        image: true,
      },
    });

    const referencedFileNames = new Set(
      referencedImages
        .map((product) => product.image)
        .filter((image): image is string => Boolean(image))
        .map((image) => basename(image)),
    );

    let entries: string[];
    try {
      entries = await readdir(uploadsDir);
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        this.logger.log(
          `Uploads cleanup skipped: directory not found at ${uploadsDir}`,
        );
        return;
      }

      throw error;
    }

    const orphanedFiles = entries.filter(
      (fileName) => !referencedFileNames.has(fileName),
    );

    if (orphanedFiles.length === 0) {
      this.logger.log(
        `Uploads cleanup finished: 0 orphaned files found in ${uploadsDir}`,
      );
      return;
    }

    this.logger.warn(
      `Uploads cleanup found ${orphanedFiles.length} orphaned file(s) in ${uploadsDir}`,
    );

    for (const fileName of orphanedFiles) {
      const absolutePath = join(uploadsDir, fileName);

      try {
        await unlink(absolutePath);
        this.logger.log(`Deleted orphaned upload: ${fileName}`);
      } catch (error: any) {
        if (error?.code === 'ENOENT') {
          this.logger.warn(`Skipped missing upload during cleanup: ${fileName}`);
          continue;
        }

        this.logger.error(
          `Failed to delete orphaned upload: ${fileName}`,
          error?.stack,
        );
      }
    }

    this.logger.log(
      `Uploads cleanup finished: deleted ${orphanedFiles.length} orphaned file(s)`,
    );
  }
}
