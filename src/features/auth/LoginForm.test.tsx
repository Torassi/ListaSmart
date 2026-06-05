import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/utils';
import { LoginForm } from './LoginForm';

function renderLogin() {
  return renderWithProviders(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );
}

describe('LoginForm', () => {
  it('mostra erros de validação ao enviar vazio', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument();
    expect(screen.getByText('A senha deve ter ao menos 8 caracteres.')).toBeInTheDocument();
  });

  it('valida formato de e-mail', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/^E-mail/i), 'invalido');
    await userEvent.type(screen.getByLabelText(/^Senha/i), '12345678');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument();
  });

  it('permite mostrar/ocultar a senha', async () => {
    renderLogin();
    const password = screen.getByLabelText(/^Senha/i);
    expect(password).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});
