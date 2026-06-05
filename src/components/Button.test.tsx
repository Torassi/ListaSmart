import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza o conteúdo', () => {
    render(<Button>Adicionar</Button>);
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
  });

  it('dispara onClick quando clicado', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Clique</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Clique' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fica desabilitado e não dispara onClick quando isLoading', async () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Salvando
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Salvando' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('aplica classes da variante secundária', () => {
    render(<Button variant="secondary">Secundário</Button>);
    expect(screen.getByRole('button', { name: 'Secundário' })).toHaveClass('bg-secondary');
  });
});
