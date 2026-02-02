import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Scale } from 'lucide-react';

// Sample constitution sections - in production, these would come from the database
const sections = [
  {
    id: '1',
    title: 'প্রস্তাবনা',
    titleEn: 'Preamble',
    content: 'এই সমিতি গঠিত হয়েছে সদস্যদের সামাজিক ও আর্থিক উন্নয়নের জন্য। আমরা বিশ্বাস করি সম্মিলিত প্রচেষ্টার মাধ্যমে সকলের কল্যাণ সাধন করা সম্ভব।',
    contentEn: 'This somiti has been formed for the social and financial development of its members. We believe that through collective effort, the welfare of all can be achieved.'
  },
  {
    id: '2',
    title: 'সদস্যপদ',
    titleEn: 'Membership',
    content: 'যেকোনো বাংলাদেশি নাগরিক এই সমিতির সদস্য হতে পারবেন। সদস্য হতে হলে মাসিক চাঁদা প্রদান করতে হবে। সদস্যপদ বাতিল হতে পারে যদি টানা তিন মাস চাঁদা পরিশোধ না করা হয়।',
    contentEn: 'Any Bangladeshi citizen can become a member of this somiti. Members must pay monthly contributions. Membership may be cancelled if dues are not paid for three consecutive months.'
  },
  {
    id: '3',
    title: 'কার্যনির্বাহী পরিষদ',
    titleEn: 'Executive Committee',
    content: 'কার্যনির্বাহী পরিষদ সভাপতি, সাধারণ সম্পাদক, কোষাধ্যক্ষ এবং ৫ জন সদস্য নিয়ে গঠিত হবে। কার্যনির্বাহী পরিষদের মেয়াদ দুই বছর।',
    contentEn: 'The executive committee shall consist of President, General Secretary, Treasurer and 5 members. The term of the executive committee is two years.'
  },
  {
    id: '4',
    title: 'আর্থিক ব্যবস্থাপনা',
    titleEn: 'Financial Management',
    content: 'সকল আয়-ব্যয়ের হিসাব সঠিকভাবে সংরক্ষণ করতে হবে এবং বার্ষিক সভায় উপস্থাপন করতে হবে। কোষাধ্যক্ষ আর্থিক বিবরণী প্রস্তুত করবেন।',
    contentEn: 'All income and expenses must be properly recorded and presented at the annual meeting. The Treasurer shall prepare the financial statements.'
  },
  {
    id: '5',
    title: 'সভা',
    titleEn: 'Meetings',
    content: 'বার্ষিক সাধারণ সভা প্রতি বছর জানুয়ারি মাসে অনুষ্ঠিত হবে। জরুরি সভা প্রয়োজন হলে ৭ দিনের নোটিশে ডাকা যাবে।',
    contentEn: 'The Annual General Meeting shall be held in January each year. Emergency meetings may be called with 7 days notice if required.'
  },
  {
    id: '6',
    title: 'সংশোধনী',
    titleEn: 'Amendments',
    content: 'সংবিধানে কোনো সংশোধনী আনতে হলে বার্ষিক সাধারণ সভায় দুই-তৃতীয়াংশ সদস্যের ভোটে অনুমোদিত হতে হবে।',
    contentEn: 'Any amendments to the constitution must be approved by a two-thirds majority vote at the Annual General Meeting.'
  },
];

export function MemberConstitutionPage() {
  const { language } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl font-bengali">
          {language === 'bn' ? 'সমিতির সংবিধান' : 'Somiti Constitution'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === 'bn' 
            ? 'সমিতির নিয়ম-নীতি ও পরিচালনা পদ্ধতি' 
            : 'Rules, regulations and governance of the somiti'}
        </p>
      </div>

      {/* Constitution Header Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Scale className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground font-bengali">
                {language === 'bn' ? 'সমিতির সংবিধান' : 'Somiti Constitution'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' ? 'সর্বশেষ আপডেট: জানুয়ারি ১, ২০২৪' : 'Last updated: January 1, 2024'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Constitution Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bengali">
            <BookOpen className="h-5 w-5" />
            {language === 'bn' ? 'ধারা সমূহ' : 'Sections'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sections.map((section, index) => (
            <div 
              key={section.id} 
              className={`p-6 ${index !== sections.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex gap-4">
                {/* Section Number */}
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {section.id}
                  </div>
                </div>
                
                {/* Section Content */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-foreground font-bengali">
                    {language === 'bn' ? section.title : section.titleEn}
                  </h3>
                  <p className="text-foreground/80 font-bengali leading-relaxed">
                    {language === 'bn' ? section.content : section.contentEn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer Note */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center font-bengali">
            {language === 'bn' 
              ? 'এই সংবিধান সমিতির সকল সদস্যের জন্য বাধ্যতামূলক।' 
              : 'This constitution is binding for all members of the somiti.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
