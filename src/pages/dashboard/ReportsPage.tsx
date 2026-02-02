import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileBarChart, Download, Calendar } from 'lucide-react';

export function ReportsPage() {
  const { t } = useLanguage();

  const reports = [
    { name: 'Monthly Financial Report', description: 'January 2024', type: 'PDF', size: '2.4 MB' },
    { name: 'Member Payment Summary', description: 'Q4 2023', type: 'Excel', size: '1.8 MB' },
    { name: 'Annual Report', description: '2023', type: 'PDF', size: '5.2 MB' },
    { name: 'Dues Report', description: 'Current Outstanding', type: 'Excel', size: '890 KB' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('nav.reports')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Generate and download financial reports
          </p>
        </div>
        <Button className="gap-2 bg-gradient-primary hover:opacity-90">
          <FileBarChart className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Monthly Report</p>
                <p className="text-sm text-muted-foreground">Current month summary</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <FileBarChart className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Annual Report</p>
                <p className="text-sm text-muted-foreground">Yearly financial summary</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Download className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Custom Export</p>
                <p className="text-sm text-muted-foreground">Custom date range</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FileBarChart className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{report.name}</p>
                    <p className="text-sm text-muted-foreground">{report.description} • {report.size}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {report.type}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
