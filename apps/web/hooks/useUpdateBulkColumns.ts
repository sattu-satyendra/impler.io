import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_KEYS } from '@config';
import { commonApi } from '@libs/api';
import { notify } from '@libs/notify';
import { track } from '@libs/amplitude';
import { IColumn, IErrorObject } from '@impler/shared';

interface UseUpdateBulkColumnsProps {
  templateId: string;
  onError?: (error: IErrorObject) => void;
}

export const useUpdateBulkColumns = ({ onError, templateId }: UseUpdateBulkColumnsProps) => {
  const queryClient = useQueryClient();

  const { mutate: updateColumnsInternal, isLoading: isUpdateColumsLoading } = useMutation<
    IColumn[],
    IErrorObject,
    Partial<IColumn>[],
    string[]
  >(
    [API_KEYS.TEMPLATE_COLUMNS_UPDATE, templateId],
    (data) => commonApi(API_KEYS.TEMPLATE_COLUMNS_UPDATE as any, { parameters: [templateId], body: data }),
    {
      onSuccess: (data) => {
        queryClient.setQueryData<IColumn[]>([API_KEYS.TEMPLATE_COLUMNS_LIST, templateId], () => data);
        queryClient.invalidateQueries({ queryKey: [API_KEYS.TEMPLATE_CUSTOMIZATION_GET, templateId] });
        track({ name: 'BULK COLUMN UPDATE', properties: {} });
        notify('COLUMNS_UPDATED');
      },
      onError(error: IErrorObject) {
        notify(error.message + 'Hola');
        onError?.(error);
      },
    }
  );

  function updateColumns(data: Partial<IColumn>[]) {
    // All features enabled - no subscription checks needed
    updateColumnsInternal(data);
  }

  return { updateColumns, isUpdateColumsLoading };
};
