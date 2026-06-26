import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductImage } from './ProductImage';

describe('ProductImage', () => {
  it('renderiza a imagem local quando a URL é válida', () => {
    render(<ProductImage src="/images/products/arroz_tiojoao_1kg.png" alt="Arroz Tio João" />);
    const img = screen.getByAltText('Arroz Tio João');
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', '/images/products/arroz_tiojoao_1kg.png');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('(13) usa fallback acessível quando a imagem não existe/falha', () => {
    render(<ProductImage src="" alt="Café Pilão Tradicional" />);
    // Fallback é um container role="img" rotulado (sem <img> real).
    const fallback = screen.getByRole('img', { name: 'Café Pilão Tradicional' });
    expect(fallback.tagName).not.toBe('IMG');
    // Mostra as iniciais do produto como pista visual.
    expect(fallback).toHaveTextContent('CP');
  });
});
