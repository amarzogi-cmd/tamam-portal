import React from 'react';
import { FormField } from '@/lib/programFields';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DynamicFieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  options?: Array<{ id: number; name: string; city?: string }>;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  options,
}) => {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={4}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'select':
        // معالجة خاصة لحقل المسجد
        if (field.name === 'mosqueId' && options) {
          return (
            <Select value={value?.toString() || ''} onValueChange={(val) => onChange(parseInt(val))} disabled={disabled}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder || 'اختر...'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.name} {option.city ? `- ${option.city}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        // الحقول الأخرى
        return (
          <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'اختر...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange} disabled={disabled}>
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} disabled={disabled} />
                <Label htmlFor={`${field.name}-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      {renderField()}
      {field.help && <p className="text-sm text-gray-500">{field.help}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
