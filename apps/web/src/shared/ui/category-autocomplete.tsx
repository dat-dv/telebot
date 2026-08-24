'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

type CategoryAutocompleteProps = {
  ariaLabel: string;
  autoFocus?: boolean;
  onCancel: () => void;
  onChange: (value: string) => void;
  onConfirm: () => void;
  options: string[];
  placeholder: string;
  value: string;
};

export function CategoryAutocomplete({
  ariaLabel,
  autoFocus,
  onCancel,
  onChange,
  onConfirm,
  options,
  placeholder,
  value,
}: CategoryAutocompleteProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 0 });

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLocaleLowerCase();
    return options.filter((option) => option.toLocaleLowerCase().includes(query));
  }, [options, value]);

  const updateMenuPosition = () => {
    const rect = inputRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPosition({ left: rect.left, top: rect.bottom + 4, width: rect.width });
  };

  useEffect(() => {
    if (!isOpen) return;

    updateMenuPosition();
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const handleViewportChange = () => updateMenuPosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, options]);

  const selectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter' && isOpen && filteredOptions[activeIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
      return;
    }
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }
    if (event.key === 'Enter') onConfirm();
    if (event.key === 'Escape') onCancel();
  };

  return (
    <div className="category-autocomplete" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="table-inline-input category-autocomplete__input"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        required
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={isOpen && filteredOptions[activeIndex] ? `${inputId}-${activeIndex}` : undefined}
      />
      <span className="category-autocomplete__indicator" aria-hidden="true">⌄</span>

      {isOpen && filteredOptions.length > 0 && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              className="category-autocomplete__menu"
              role="listbox"
              aria-label={ariaLabel}
              style={menuPosition}
            >
              {filteredOptions.map((option, index) => (
                <div
                  key={option}
                  id={`${inputId}-${index}`}
                  className={`category-autocomplete__option ${index === activeIndex ? 'is-active' : ''}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  {option}
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
