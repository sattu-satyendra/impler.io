import { ReactNode } from 'react';
import { Control, FieldErrors } from 'react-hook-form';
import { Flex, MantineSize, Stack } from '@mantine/core';

import { Checkbox } from '@ui/checkbox';
import { AutoHeightComponent } from '@ui/auto-height-component';

import { IColumn } from '@impler/shared';
import { ValidationTypesEnum } from '@impler/client';
import { TooltipLabel } from '@components/guide-point';

import useStyles from './Validation.styles';
import { MinMaxValidation } from './MinMaxValidation';
import { UniqueWithValidation } from './UniqueWithValidation';
import { DigitsValidation } from './DigitsValidation';

interface ValidationProps {
  link: string;
  label: string;
  size?: MantineSize;
  description?: ReactNode;
  index: number;
  min?: number;
  max?: number;
  unavailable?: boolean;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  control: Control<IColumn>;
  type?: ValidationTypesEnum;
  errors?: FieldErrors<IColumn>;
  errorMessagePlaceholder?: string;
  onCheckToggle: (status: boolean, index: number) => void;
}

export function Validation({
  link,
  label,
  index,
  errors,
  control,
  min,
  max,
  type,
  size = 'sm',
  description,
  onCheckToggle,
  minPlaceholder,
  maxPlaceholder,
  errorMessagePlaceholder,
}: ValidationProps) {
  const { classes } = useStyles({ showWrapper: false });

  return (
    <Flex direction="row" gap="sm" className={classes.wrapper} align="center">
      <Checkbox checked={index > -1} onChange={(status) => onCheckToggle(status, index)} />

      <Stack spacing={5} w="100%" align="flex-start">
        <div>
          <TooltipLabel link={link} label={label} />
          {description ? <p className={classes.description}>{description}</p> : null}
        </div>
        <AutoHeightComponent isVisible={index > -1 && type === ValidationTypesEnum.DIGITS}>
          {type === ValidationTypesEnum.DIGITS ? (
            <DigitsValidation
              minDigits={min}
              maxDigits={max}
              key={index}
              size={size}
              index={index}
              errors={errors}
              control={control}
              minPlaceholder="Min digits"
              maxPlaceholder="Max digits"
              errorMessagePlaceholder={errorMessagePlaceholder}
            />
          ) : type === ValidationTypesEnum.UNIQUE_WITH ? (
            <UniqueWithValidation
              key={index}
              index={index}
              control={control}
              errors={errors}
              size={size}
              errorMessagePlaceholder={errorMessagePlaceholder}
            />
          ) : (
            <MinMaxValidation
              max={max}
              min={min}
              key={index}
              size={size}
              index={index}
              errors={errors}
              control={control}
              maxPlaceholder={maxPlaceholder}
              minPlaceholder={minPlaceholder}
              errorMessagePlaceholder={errorMessagePlaceholder}
            />
          )}
        </AutoHeightComponent>
        <AutoHeightComponent isVisible={index > -1 && type === ValidationTypesEnum.UNIQUE_WITH}>
          <UniqueWithValidation
            key={index}
            size={size}
            index={index}
            errors={errors}
            control={control}
            errorMessagePlaceholder={errorMessagePlaceholder}
          />
        </AutoHeightComponent>
        <AutoHeightComponent
          isVisible={index > -1 && (type === ValidationTypesEnum.LENGTH || type === ValidationTypesEnum.RANGE)}
        >
          <MinMaxValidation
            max={max}
            min={min}
            key={index}
            size={size}
            index={index}
            errors={errors}
            control={control}
            maxPlaceholder={maxPlaceholder}
            minPlaceholder={minPlaceholder}
            errorMessagePlaceholder={errorMessagePlaceholder}
          />
        </AutoHeightComponent>
      </Stack>
    </Flex>
  );
}
