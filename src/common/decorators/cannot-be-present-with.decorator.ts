import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function CannotBePresentWith(
  property: string,
  validationOptions?: ValidationOptions,
) {
  // 1. Cambiamos 'Object' por 'object' (minúscula)
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'cannotBePresentWith',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          // 2. Evitamos desestructuración insegura tomando el índice 0 directamente
          const relatedPropertyName = String(args.constraints[0]);
          // 3. Tipamos 'args.object' como un Record genérico en lugar de 'any'
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];

          // 4. Simplificamos la comparación de nulos/undefined según sugiere ESLint
          if (value != null && relatedValue != null) {
            return false;
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const relatedPropertyName = String(args.constraints[0]);
          // 5. Corregimos 'propertyName' a 'property' (el nombre correcto en ValidationArguments)
          return `No puedes enviar '${args.property}' si '${relatedPropertyName}' ya está presente. Elige solo uno.`;
        },
      },
    });
  };
}
