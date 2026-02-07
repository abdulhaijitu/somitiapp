import { useState, useEffect, useCallback, useMemo } from 'react';

export interface Section {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  element?: HTMLElement;
}

interface UseSectionNavigationOptions {
  containerRef: React.RefObject<HTMLElement>;
  htmlContent?: string;
  editorContent?: string;
}

/**
 * Hook to parse sections from HTML content and manage active section state
 */
export function useSectionNavigation({
  containerRef,
  htmlContent,
  editorContent,
}: UseSectionNavigationOptions) {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Parse sections from HTML content
  const parseSections = useCallback((html: string): Section[] => {
    if (!html || html.trim() === '' || html === '<p></p>') {
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');
    
    const parsedSections: Section[] = [];
    
    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim();
      if (text) {
        const tagName = heading.tagName.toLowerCase();
        const level = tagName === 'h1' ? 1 : tagName === 'h2' ? 2 : 3;
        const id = `section-${index}-${text.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').slice(0, 30)}`;
        parsedSections.push({ id, title: text, level });
      }
    });

    return parsedSections;
  }, []);

  // Update sections when content changes
  useEffect(() => {
    const content = editorContent || htmlContent || '';
    const newSections = parseSections(content);
    setSections(newSections);
    
    // Set first section as active if none selected
    if (newSections.length > 0 && !activeSection) {
      setActiveSection(newSections[0].id);
    }
  }, [htmlContent, editorContent, parseSections, activeSection]);

  // Assign IDs to actual DOM headings for scroll targeting
  const assignHeadingIds = useCallback(() => {
    if (!containerRef.current || sections.length === 0) return;

    const headings = containerRef.current.querySelectorAll('h1, h2, h3');
    let sectionIndex = 0;

    headings.forEach((heading) => {
      const text = heading.textContent?.trim();
      if (text && sections[sectionIndex]) {
        heading.id = sections[sectionIndex].id;
        sectionIndex++;
      }
    });
  }, [containerRef, sections]);

  // Assign IDs after sections are parsed and DOM updates
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(assignHeadingIds, 100);
    return () => clearTimeout(timer);
  }, [assignHeadingIds, htmlContent, editorContent]);

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    if (!containerRef.current) return;

    const heading = containerRef.current.querySelector(`#${CSS.escape(sectionId)}`);
    if (heading) {
      heading.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      setActiveSection(sectionId);
    }
  }, [containerRef]);

  // Track active section based on scroll position
  useEffect(() => {
    if (!containerRef.current || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    // Observe all section headings
    sections.forEach((section) => {
      const element = containerRef.current?.querySelector(`#${CSS.escape(section.id)}`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [containerRef, sections]);

  return {
    sections,
    activeSection,
    scrollToSection,
    setActiveSection,
  };
}
