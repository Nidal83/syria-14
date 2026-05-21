import { useEffect } from 'react';

interface PageSeoOptions {
  title: string;
  description: string;
  ogImage?: string;
}

export function usePageSeo({ title, description, ogImage }: PageSeoOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
      return el;
    };

    const descEl = setMeta('description', description);
    const ogTitle = setMeta('og:title', title, true);
    const ogDesc = setMeta('og:description', description, true);
    const ogImg = ogImage ? setMeta('og:image', ogImage, true) : null;

    return () => {
      document.title = prevTitle;
      descEl.removeAttribute('content');
      ogTitle.removeAttribute('content');
      ogDesc.removeAttribute('content');
      ogImg?.removeAttribute('content');
    };
  }, [title, description, ogImage]);
}
