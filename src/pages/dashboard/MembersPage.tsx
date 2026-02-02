import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Mail,
  Phone,
  User,
  Filter
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

// Mock member data
const members = [
  { 
    id: '1', 
    name: 'আব্দুল করিম', 
    nameEn: 'Abdul Karim',
    mobile: '+880 1712-345678', 
    role: 'member',
    status: 'active',
    joinDate: '2023-01-15',
    totalPaid: 12000,
    dues: 0
  },
  { 
    id: '2', 
    name: 'ফাতেমা বেগম', 
    nameEn: 'Fatema Begum',
    mobile: '+880 1812-456789', 
    role: 'manager',
    status: 'active',
    joinDate: '2022-06-20',
    totalPaid: 24000,
    dues: 1000
  },
  { 
    id: '3', 
    name: 'মোহাম্মদ আলী', 
    nameEn: 'Mohammad Ali',
    mobile: '+880 1912-567890', 
    role: 'member',
    status: 'active',
    joinDate: '2023-03-10',
    totalPaid: 10000,
    dues: 2000
  },
  { 
    id: '4', 
    name: 'নূরজাহান খাতুন', 
    nameEn: 'Nurjahan Khatun',
    mobile: '+880 1612-678901', 
    role: 'admin',
    status: 'active',
    joinDate: '2021-01-01',
    totalPaid: 36000,
    dues: 0
  },
  { 
    id: '5', 
    name: 'রহিম উদ্দিন', 
    nameEn: 'Rahim Uddin',
    mobile: '+880 1512-789012', 
    role: 'member',
    status: 'inactive',
    joinDate: '2023-08-05',
    totalPaid: 3000,
    dues: 3000
  },
];

export function MembersPage() {
  const { t, language } = useLanguage();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('members.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage all your somiti members
          </p>
        </div>
        <Button className="gap-2 bg-gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4" />
          {t('members.addMember')}
        </Button>
      </div>

      {/* Filters and search */}
      <Card className="border-border">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members table */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            All Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[250px]">{t('members.name')}</TableHead>
                  <TableHead>{t('members.mobile')}</TableHead>
                  <TableHead>{t('members.role')}</TableHead>
                  <TableHead>{t('members.status')}</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Dues</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground font-bengali">
                            {language === 'bn' ? member.name : member.nameEn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {member.joinDate}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {member.mobile}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          member.status === 'active'
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {member.status === 'active' ? t('members.active') : t('members.inactive')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ৳ {member.totalPaid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={member.dues > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        ৳ {member.dues.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>{t('common.edit')}</DropdownMenuItem>
                          <DropdownMenuItem>Payment History</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
