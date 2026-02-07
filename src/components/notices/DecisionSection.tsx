import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Gavel, CheckCircle2, XCircle, Clock, Edit, Calendar, User } from 'lucide-react';
import type { NoticeDecision } from '@/hooks/useNoticeDecision';

interface DecisionSectionProps {
  decision: NoticeDecision | null;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (status: 'approved' | 'rejected' | 'deferred', text: string) => Promise<boolean>;
}

const STATUS_CONFIG = {
  approved: {
    en: 'Approved', bn: 'অনুমোদিত',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
    bgClass: 'border-emerald-500/30 bg-emerald-500/5',
  },
  rejected: {
    en: 'Rejected', bn: 'প্রত্যাখ্যাত',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400',
    bgClass: 'border-red-500/30 bg-red-500/5',
  },
  deferred: {
    en: 'Deferred', bn: 'স্থগিত',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
    bgClass: 'border-amber-500/30 bg-amber-500/5',
  },
};

export function DecisionSection({ decision, isLoading, isSaving, onSave }: DecisionSectionProps) {
  const { language } = useLanguage();
  const { isAdmin } = useTenant();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'approved' | 'rejected' | 'deferred'>('approved');
  const [text, setText] = useState('');

  useEffect(() => {
    if (decision) {
      setStatus(decision.status);
      setText(decision.decision_text);
    }
  }, [decision]);

  const handleSave = async () => {
    if (!text.trim()) return;
    const success = await onSave(status, text.trim());
    if (success) setIsEditing(false);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'bn') {
      return date.toLocaleString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show decision view
  if (decision && !isEditing) {
    const config = STATUS_CONFIG[decision.status];
    const StatusIcon = config.icon;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              {language === 'bn' ? 'সিদ্ধান্ত' : 'Decision'}
            </h3>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
            </Button>
          )}
        </div>

        <div className={`rounded-lg border-2 p-4 ${config.bgClass}`}>
          <div className="flex items-center gap-2 mb-3">
            <StatusIcon className="h-5 w-5" />
            <Badge className={config.className}>
              {language === 'bn' ? config.bn : config.en}
            </Badge>
          </div>

          <p className="text-foreground/90 whitespace-pre-wrap font-bengali">
            {decision.decision_text}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {decision.decided_by_name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateTime(decision.decided_at)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show form for admin
  if (isAdmin) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            {language === 'bn' ? 'সিদ্ধান্ত' : 'Decision'}
          </h3>
        </div>

        {!decision && !isEditing ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Gavel className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">
              {language === 'bn' ? 'এখনো কোনো সিদ্ধান্ত নেওয়া হয়নি' : 'No decision has been made yet'}
            </p>
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Gavel className="h-4 w-4 mr-2" />
              {language === 'bn' ? 'সিদ্ধান্ত দিন' : 'Set Decision'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-border p-4 bg-card">
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'সিদ্ধান্তের স্থিতি' : 'Decision Status'}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
                    </span>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      {language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
                    </span>
                  </SelectItem>
                  <SelectItem value="deferred">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      {language === 'bn' ? 'স্থগিত' : 'Deferred'}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === 'bn' ? 'সিদ্ধান্তের বিবরণ' : 'Decision Details'} *</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={language === 'bn' ? 'সিদ্ধান্তের বিস্তারিত লিখুন...' : 'Write the decision details...'}
                rows={3}
                disabled={isSaving}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  if (decision) {
                    setStatus(decision.status);
                    setText(decision.decision_text);
                  }
                }}
                disabled={isSaving}
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!text.trim() || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Gavel className="h-4 w-4 mr-2" />
                )}
                {language === 'bn' ? 'সিদ্ধান্ত সংরক্ষণ' : 'Save Decision'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Non-admin with no decision
  if (!decision) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            {language === 'bn' ? 'সিদ্ধান্ত' : 'Decision'}
          </h3>
        </div>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <Gavel className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            {language === 'bn' ? 'এখনো কোনো সিদ্ধান্ত নেওয়া হয়নি' : 'No decision has been made yet'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
