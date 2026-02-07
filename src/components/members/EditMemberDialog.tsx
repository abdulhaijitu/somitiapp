import { useState, useEffect, useRef } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, User } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  name_bn?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  member_number?: string | null;
  nid_number?: string | null;
  photo_url?: string | null;
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
    nid_number?: string;
    photo_url?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [status, setStatus] = useState('active');
  const [memberNumberError, setMemberNumberError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setNameBn(member.name_bn || '');
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setAddress(member.address || '');
      setMemberNumber(member.member_number || '');
      setNidNumber(member.nid_number || '');
      setStatus(member.status || 'active');
      setMemberNumberError(null);
      setPhotoPreview(member.photo_url || null);
      setPhotoFile(null);
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return;
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      nid_number: nidNumber.trim() || undefined,
      photo_url: photoPreview || undefined,
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
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20 cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <AvatarImage src={photoPreview} alt="Member photo" />
              ) : (
                <AvatarFallback className="bg-muted">
                  <User className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              )}
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {language === 'bn' ? 'ছবি আপলোড' : 'Upload Photo'}
            </Button>
            <p className="text-xs text-muted-foreground">
              {language === 'bn' ? 'ঐচ্ছিক • সর্বোচ্চ 2MB' : 'Optional • Max 2MB'}
            </p>
          </div>
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

          {/* NID Number */}
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'জাতীয় পরিচয়পত্র নম্বর (NID)' : 'NID Number'}</Label>
            <Input
              value={nidNumber}
              onChange={(e) => setNidNumber(e.target.value)}
              placeholder={language === 'bn' ? 'যেমন: 1234567890123' : 'e.g., 1234567890123'}
            />
            <p className="text-xs text-muted-foreground">
              {language === 'bn' 
                ? 'ঐচ্ছিক • ১০ বা ১৭ ডিজিট' 
                : 'Optional • 10 or 17 digits'}
            </p>
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
