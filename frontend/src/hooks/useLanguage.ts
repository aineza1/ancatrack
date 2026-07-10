import { useState } from 'react'
import type { Language } from '../utils/translations'
import { translations } from '../utils/translations'

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('en')

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key]
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'rw' : 'en')
  }

  return { language, toggleLanguage, t }
}
