import { describe, expect, it } from 'vitest';
import { login, signup } from './auth';

describe('auth service (mock)', () => {
  it('cadastra e depois permite login com as mesmas credenciais', async () => {
    await signup({ name: 'Ana', email: 'ana@teste.com', password: 'senha1234', confirmPassword: 'senha1234' });
    const user = await login({ email: 'ana@teste.com', password: 'senha1234' });
    expect(user.email).toBe('ana@teste.com');
    expect(user.name).toBe('Ana');
  });

  it('bloqueia cadastro com e-mail já existente', async () => {
    await signup({ name: 'Bia', email: 'bia@teste.com', password: 'senha1234', confirmPassword: 'senha1234' });
    await expect(
      signup({ name: 'Bia 2', email: 'bia@teste.com', password: 'outrasenha', confirmPassword: 'outrasenha' }),
    ).rejects.toThrow('já está cadastrado');
  });

  it('rejeita login com senha incorreta', async () => {
    await signup({ name: 'Caio', email: 'caio@teste.com', password: 'senha1234', confirmPassword: 'senha1234' });
    await expect(login({ email: 'caio@teste.com', password: 'errada99' })).rejects.toThrow(
      'E-mail ou senha incorretos.',
    );
  });

  it('rejeita login de e-mail inexistente (mensagem genérica)', async () => {
    await expect(login({ email: 'naoexiste@teste.com', password: 'qualquer123' })).rejects.toThrow(
      'E-mail ou senha incorretos.',
    );
  });

  it('aceita a conta de demonstração padrão', async () => {
    const user = await login({ email: 'demo@listasmart.com', password: '12345678' });
    expect(user.name).toBe('Demonstração');
  });
});
