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
    
    // First try proper heading tags
    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim();
      if (text) {
        const tagName = heading.tagName.toLowerCase();
        const level = tagName === 'h1' ? 1 : tagName === 'h2' ? 2 : 3;
        const id = `section-${index}-${text.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').slice(0, 30)}`;
        
        parsedSections.push({ id, title: text, level });
      }
    });

    // Fallback: if no headings found, detect bold-only paragraphs as sections
    if (parsedSections.length === 0) {
      const paragraphs = doc.querySelectorAll('p');
      let sectionIndex = 0;
      paragraphs.forEach((p) => {
        // Check if paragraph contains only bold/strong text (possibly with underline)
        const children = p.childNodes;
        const isBoldOnly = children.length > 0 && Array.from(children).every((child) => {
          if (child.nodeType === Node.TEXT_NODE) return !child.textContent?.trim();
          if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            const tag = el.tagName.toLowerCase();
            return tag === 'strong' || tag === 'b' || 
              (tag === 'u' && el.querySelector('strong, b')) ||
              ((tag === 'strong' || tag === 'b') && el.querySelector('u'));
          }
          return false;
        });

        const text = p.textContent?.trim();
        if (isBoldOnly && text && text.length > 0 && text.length < 200) {
          const id = `section-${sectionIndex}-${text.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').slice(0, 30)}`;
          parsedSections.push({ id, title: text, level: 1 });
          sectionIndex++;
        }
      });
    }

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

    // Try proper headings first
    const headings = containerRef.current.querySelectorAll('h1, h2, h3');
    
    if (headings.length > 0) {
      let sectionIndex = 0;
      headings.forEach((heading) => {
        const text = heading.textContent?.trim();
        if (text && sections[sectionIndex]) {
          heading.id = sections[sectionIndex].id;
          sectionIndex++;
        }
      });
    } else {
      // Fallback: assign IDs to bold-only paragraphs
      const paragraphs = containerRef.current.querySelectorAll('p');
      let sectionIndex = 0;
      paragraphs.forEach((p) => {
        const children = p.childNodes;
        const isBoldOnly = children.length > 0 && Array.from(children).every((child) => {
          if (child.nodeType === Node.TEXT_NODE) return !child.textContent?.trim();
          if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            const tag = el.tagName.toLowerCase();
            return tag === 'strong' || tag === 'b' || 
              (tag === 'u' && el.querySelector('strong, b')) ||
              ((tag === 'strong' || tag === 'b') && el.querySelector('u'));
          }
          return false;
        });
        const text = p.textContent?.trim();
        if (isBoldOnly && text && text.length > 0 && text.length < 200 && sections[sectionIndex]) {
          p.id = sections[sectionIndex].id;
          sectionIndex++;
        }
      });
    }
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
