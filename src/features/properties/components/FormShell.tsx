import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function FormShell({ title, subtitle, children }: Props) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
