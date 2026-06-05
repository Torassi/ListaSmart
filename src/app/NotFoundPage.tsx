/** Tela 404. */
import { Link } from 'react-router-dom';
import { Button } from '@/components';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-3 text-xl font-bold text-text">Página não encontrada</h1>
      <p className="mt-2 text-sm text-text-muted">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    </div>
  );
}
