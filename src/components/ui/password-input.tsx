import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  wrapperClassName?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, autoComplete = 'current-password', ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const { t, isRTL } = useI18n();
    const toggle = () => setVisible((v) => !v);

    return (
      <div className={cn('relative', wrapperClassName)}>
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={cn(isRTL ? 'ps-10' : 'pe-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
          aria-pressed={visible}
          tabIndex={-1}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isRTL ? 'start-1' : 'end-1',
          )}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
