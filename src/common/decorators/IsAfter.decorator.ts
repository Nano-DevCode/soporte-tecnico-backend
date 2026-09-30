import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

interface IsAfterOptions extends ValidationOptions {
  allowEqual?: boolean;
}

export function IsAfter(property: string, options?: IsAfterOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: options,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];

          if (relatedValue === undefined || relatedValue === null) {
            return true;
          }

          const dateValue = new Date(value as string | number | Date);
          const relatedDateValue = new Date(
            relatedValue as string | number | Date,
          );

          if (isNaN(dateValue.getTime()) || isNaN(relatedDateValue.getTime())) {
            return false;
          }

          const allowEqual = options?.allowEqual ?? false;

          if (allowEqual) {
            return dateValue.getTime() >= relatedDateValue.getTime();
          } else {
            return dateValue.getTime() > relatedDateValue.getTime();
          }
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedPropertyName] = args.constraints as [string];
          const allowEqual = options?.allowEqual ?? false;
          return allowEqual
            ? `$property debe ser igual o posterior a ${relatedPropertyName}`
            : `$property debe ser estrictamente posterior a ${relatedPropertyName}`;
        },
      },
    });
  };
}
