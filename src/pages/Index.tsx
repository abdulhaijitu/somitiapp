import { LanguageProvider } from '@/contexts/LanguageContext';
import { LandingPage } from '@/pages/LandingPage';

const Index = () => {
  return (
    <LanguageProvider>
      <LandingPage />
    </LanguageProvider>
  );
};

export default Index;
