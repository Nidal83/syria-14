import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Optional className applied to the wrapper div */
  wrapperClassName?: string;
};

/**
 * Password input with show/hide toggle.
 *
 * - Defaults `autoComplete` to `"current-password"` (set `new-password` on registration/reset
 *   forms so password managers know not to autofill an existing credential).
 * - RTL-aware: toggle button appears on the trailing edge in both directions.
 * - The toggle is a real `<button type="button">` so it never submits the parent form.
 * - Aria labels switch when toggling for screen readers.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, autoComplete = 'current-password', ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const { lang } = useLanguage();
    const toggle = () => setVisible((v) => !v);

    return (
      <div className={cn('relative', wrapperClassName)}>
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={cn(lang === 'ar' ? 'ps-10' : 'pe-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={
            visible
              ? lang === 'ar'
                ? 'إخفاء كلمة المرور'
                : 'Hide password'
              : lang === 'ar'
                ? 'إظهار كلمة المرور'
                : 'Show password'
          }
          aria-pressed={visible}
          tabIndex={-1}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            lang === 'ar' ? 'start-1' : 'end-1',
          )}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
