
import { useState, useEffect } from 'react';

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  // Obter do localStorage na inicialização com tratamento de erros melhorado
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Verificar se o item existe e se não é undefined, null, ou uma string vazia
      if (item && item !== "undefined" && item !== "null") {
        try {
          // Tentar analisar o valor JSON
          return JSON.parse(item);
        } catch {
          // Se não for um JSON válido, retornar o valor bruto
          return item as unknown as T;
        }
      }
      // Se o item não existir ou for inválido, use o initialValue
      return initialValue;
    } catch (error) {
      console.error(`Erro ao recuperar do localStorage (${key}):`, error);
      return initialValue;
    }
  });

  // Função de setValue com persistência melhorada
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value seja uma função para mesma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar no state
      setStoredValue(valueToStore);
      
      // Guardar no localStorage com tratamento de erros
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      // Disparar um evento customizado para notificar outras abas ou componentes
      window.dispatchEvent(new CustomEvent('storage-updated', {
        detail: { key, value: valueToStore }
      }));
    } catch (error) {
      console.error(`Erro ao salvar no localStorage (${key}):`, error);
    }
  };

  // Sincronizar com alterações do localStorage de outras abas/janelas
  useEffect(() => {
    // Usar o evento storage nativo para detectar alterações
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
        } catch {
          setStoredValue(initialValue);
        }
      } else if (event.key === key && event.newValue === null) {
        // Item foi removido
        setStoredValue(initialValue);
      }
    };

    // Escutar o evento storage nativo
    window.addEventListener('storage', handleStorageChange);

    // Escutar o evento customizado para sincronização entre componentes da mesma aba
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    window.addEventListener('storage-updated', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-updated', handleCustomStorageChange as EventListener);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
};
