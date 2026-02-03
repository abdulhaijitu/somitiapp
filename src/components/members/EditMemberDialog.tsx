import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  name_bn?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  member_number?: string | null;
  status: string;
}

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSubmit: (id: string, data: {
    name: string;
    name_bn?: string;
    phone?: string;
    email?: string;
    address?: string;
    member_number?: string;
    status: string;
  }) => void;
  isSubmitting: boolean;
  existingMemberNumbers?: string[];
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  onSubmit,
  isSubmitting,
  existingMemberNumbers = []
}: EditMemberDialogProps) {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [status, setStatus] = useState('active');
  const [memberNumberError, setMemberNumberError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setNameBn(member.name_bn || '');
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setAddress(member.address || '');
      setMemberNumber(member.member_number || '');
      setStatus(member.status || 'active');
      setMemberNumberError(null);
    }
  }, [member]);

  const validateMemberNumber = (value: string) => {
    if (value && value.trim() !== member?.member_number) {
      const otherNumbers = existingMemberNumbers.filter(n => n !== member?.member_number);
      if (otherNumbers.includes(value.trim())) {
        setMemberNumberError(language === 'bn' 
          ? 'এই সদস্য নম্বর ইতিমধ্যে ব্যবহৃত হয়েছে' 
          : 'This member number is already in use');
        return false;
      }
    }
    setMemberNumberError(null);
    return true;
  };

  const handleMemberNumberChange = (value: string) => {
    setMemberNumber(value);
    validateMemberNumber(value);
  };

  const handleSubmit = () => {
    if (!member || !name.trim()) return;
    if (memberNumber && !validateMemberNumber(memberNumber)) return;
    
    onSubmit(member.id, {
      name: name.trim(),
      name_bn: nameBn.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      member_number: memberNumber.trim() || undefined,
      status
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'bn' ? 'সদস্য সম্পাদনা' : 'Edit Member'}
          </DialogTitle>
          <DialogDescription>
            {language === 'bn' ? 'সদস্যের তথ্য আপডেট করুন' : 'Update member information'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Number */}
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'সদস্য নম্বর' : 'Member Number'}</Label>
            <Input
              value={memberNumber}
              onChange={(e) => handleMemberNumberChange(e.target.value)}
              placeholder={language === 'bn' ? 'যেমন: M001' : 'e.g., M001'}
              className={memberNumberError ? 'border-destructive' : ''}
            />
            {memberNumberError && (
              <p className="text-xs text-destructive">{memberNumberError}</p>
            )}
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'নাম (ইংরেজি) *' : 'Name (English) *'}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'bn' ? 'সদস্যের নাম' : 'Member name'}
              />
            </div>
            <div className="space-y-2">
              <Label>নাম (বাংলা)</Label>
              <Input
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="সদস্যের নাম"
                className="font-bengali"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'ফোন' : 'Phone'}</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'ঠিকানা' : 'Address'}</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={language === 'bn' ? 'সম্পূর্ণ ঠিকানা' : 'Full address'}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  {language === 'bn' ? 'সক্রিয়' : 'Active'}
                </SelectItem>
                <SelectItem value="inactive">
                  {language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
                </SelectItem>
                <SelectItem value="suspended">
                  {language === 'bn' ? 'স্থগিত' : 'Suspended'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info about monthly contribution */}
          <div className="rounded-lg border border-muted bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              {language === 'bn' 
                ? 'মাসিক চাঁদা সমিতির সেটিংস দ্বারা নির্ধারিত এবং পেমেন্টের সময় প্রযোজ্য হবে।'
                : 'Monthly contribution is defined by the somiti and applied during payment.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !!memberNumberError || isSubmitting}
            className="bg-gradient-primary hover:opacity-90 gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
