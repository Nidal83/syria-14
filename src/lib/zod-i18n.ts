import { z } from 'zod';
import type { Translations } from './i18n/locales/ar';

export function installZodErrorMap(t: Translations) {
  z.setErrorMap((issue, ctx) => {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.received === 'undefined' || issue.received === 'null') {
          return { message: t.validation.required };
        }
        if (
          issue.expected === 'number' ||
          issue.expected === 'integer' ||
          issue.expected === 'float'
        ) {
          return { message: t.validation.notANumber };
        }
        return { message: t.validation.required };

      case z.ZodIssueCode.too_small:
        if (issue.type === 'string' && issue.minimum === 1) {
          return { message: t.validation.required };
        }
        if (issue.type === 'number') {
          return { message: t.validation.mustBePositive };
        }
        if (issue.type === 'array') {
          return { message: t.validation.atLeastOne };
        }
        return { message: t.validation.tooShort };

      case z.ZodIssueCode.too_big:
        return { message: t.validation.tooLong };

      case z.ZodIssueCode.invalid_string:
        if (issue.validation === 'email') {
          return { message: t.validation.invalidEmail };
        }
        if (issue.validation === 'url') {
          return { message: t.validation.invalidUrl };
        }
        if (issue.validation === 'regex') {
          return { message: t.validation.invalidPhone };
        }
        return { message: ctx.defaultError };

      default:
        return { message: ctx.defaultError };
    }
  });
}
