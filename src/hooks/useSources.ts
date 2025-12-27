import { useState, useCallback } from 'react';
import { Source, SourceFlow, SourceCategory, defaultSources } from '@/types';

export function useSources() {
  const [sources, setSources] = useState<Source[]>(defaultSources);

  const addSource = useCallback((source: Omit<Source, 'id' | 'createdAt'>) => {
    const newSource: Source = {
      ...source,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setSources(prev => [...prev, newSource]);
    return newSource;
  }, []);

  const updateSource = useCallback((id: string, updates: Partial<Source>) => {
    setSources(prev => prev.map(source => 
      source.id === id ? { ...source, ...updates } : source
    ));
  }, []);

  const deleteSource = useCallback((id: string) => {
    setSources(prev => prev.filter(source => source.id !== id));
  }, []);

  const toggleSourceActive = useCallback((id: string) => {
    setSources(prev => prev.map(source => 
      source.id === id ? { ...source, isActive: !source.isActive } : source
    ));
  }, []);

  const getSourcesByFlow = useCallback((flow: SourceFlow | 'all') => {
    if (flow === 'all') return sources.filter(s => s.isActive);
    return sources.filter(s => s.isActive && (s.flow === flow || s.flow === 'ambos'));
  }, [sources]);

  const getSourcesByCategory = useCallback((category: SourceCategory) => {
    return sources.filter(s => s.isActive && s.category === category);
  }, [sources]);

  const getSourceById = useCallback((id: string) => {
    return sources.find(s => s.id === id);
  }, [sources]);

  return {
    sources,
    addSource,
    updateSource,
    deleteSource,
    toggleSourceActive,
    getSourcesByFlow,
    getSourcesByCategory,
    getSourceById,
  };
}
