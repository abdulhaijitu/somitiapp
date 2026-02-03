import { LanguageProvider } from '@/contexts/LanguageContext';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { HomePage } from '@/pages/public/HomePage';

const Index = () => {
  return (
    <LanguageProvider>
      <PublicLayout>
        <HomePage />
      </PublicLayout>
    </LanguageProvider>
  );
};

export default Index;
