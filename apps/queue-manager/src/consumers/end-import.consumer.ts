import * as Sentry from '@sentry/node';
import { Readable } from 'stream';
import { DalService, FileRepository, UploadRepository } from '@impler/dal';
import { QueuesEnum, EndImportData, FileMimeTypesEnum, DestinationsEnum } from '@impler/shared';
import { FileNameService, StorageService } from '@impler/services';

import { BaseConsumer } from './base.consumer';
import { publishToQueue } from '../bootstrap';
import * as Papa from 'papaparse';
import { getStorageServiceClass } from '../helpers/services.helper';

export class EndImportConsumer extends BaseConsumer {
  private dalService: DalService = new DalService();
  private fileRepository: FileRepository = new FileRepository();
  private fileNameService: FileNameService = new FileNameService();
  private storageService: StorageService = getStorageServiceClass();
  private uploadRepository: UploadRepository = new UploadRepository();

  async message(message: { content: string }) {
    const data = JSON.parse(message.content) as EndImportData;

    try {
      await this.convertRecordsToJsonFile(data.uploadId, data.uploadedFileId);

      // All features enabled - no subscription check needed
      if (data.destination === DestinationsEnum.WEBHOOK) {
        publishToQueue(QueuesEnum.SEND_WEBHOOK_DATA, {
          uploadId: data.uploadId,
        });
      } else if (data.destination === DestinationsEnum.BUBBLEIO) {
        publishToQueue(QueuesEnum.SEND_BUBBLE_DATA, {
          uploadId: data.uploadId,
        });
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  private async convertRecordsToJsonFile(uploadId: string, uploadedFileId?: string): Promise<void> {
    try {
      const jsonStream = this.dalService.getRecordsStream(uploadId);
      const allJsonDataFilePath = this.fileNameService.getAllJsonDataFilePath(uploadId);
      await this.storageService.uploadFile(allJsonDataFilePath, jsonStream, FileMimeTypesEnum.JSON);
      await this.dalService.dropRecordCollection(uploadId);

      if (!uploadedFileId) {
        const csvData = await this.convertImportDataToCsv(jsonStream);
        const importedFileName = this.fileNameService.getImportedFileName(uploadId);
        const filePath = this.fileNameService.getImportedFilePath(uploadId);
        const uploadedFileEntry = await this.fileRepository.create({
          mimeType: FileMimeTypesEnum.CSV,
          name: importedFileName,
          originalName: importedFileName,
          path: filePath,
        });
        await this.storageService.uploadFile(filePath, csvData, FileMimeTypesEnum.CSV);
        await this.uploadRepository.findOneAndUpdate(
          {
            _id: uploadId,
          },
          {
            $set: {
              _uploadedFileId: uploadedFileEntry._id,
              originalFileName: importedFileName,
              originalFileType: FileMimeTypesEnum.CSV,
            },
          }
        );
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  async convertImportDataToCsv(importData: Readable) {
    const recordsData = importData.map((item) => item.record);

    const csv = Papa.unparse(recordsData, {
      header: true,
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
    });

    return csv;
  }
}
