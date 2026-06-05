/**
 * ListsPage — "Minhas listas": cria, renomeia, exclui e alterna entre listas.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Badge, Button, Card, CardBody, Input } from '@/components';
import { useToast } from '@/hooks/useToast';
import { useLists } from './ListContext';
import type { ListSummary } from './ListContext';

export function ListsPage() {
  const { lists, activeId, createList, renameList, deleteList, selectList } = useLists();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');

  function handleCreate() {
    const name = newName.trim() || 'Nova lista';
    createList(name);
    setNewName('');
    toast(`Lista "${name}" criada`, 'success');
    navigate('/lista');
  }

  function handleOpen(id: string) {
    selectList(id);
    navigate('/lista');
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-text">Minhas listas</h1>
        <p className="mt-1 text-sm text-text-muted">Crie e organize suas listas de compras.</p>
      </header>

      {/* Criar nova lista */}
      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Nome da nova lista (ex.: Compra do mês)"
            maxLength={60}
            aria-label="Nome da nova lista"
            className="sm:max-w-sm"
          />
          <Button onClick={handleCreate} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Criar lista
          </Button>
        </CardBody>
      </Card>

      {/* Grade de listas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            isActive={list.id === activeId}
            canDelete={lists.length > 1}
            onOpen={() => handleOpen(list.id)}
            onRename={(name) => renameList(list.id, name)}
            onDelete={() => {
              deleteList(list.id);
              toast('Lista excluída', 'info');
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ListCardProps {
  list: ListSummary;
  isActive: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

function ListCard({ list, isActive, canDelete, onOpen, onRename, onDelete }: ListCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);

  function save() {
    const trimmed = name.trim();
    if (trimmed) onRename(trimmed);
    else setName(list.name);
    setEditing(false);
  }

  return (
    <Card interactive className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-active">
          <ListChecks className="h-5 w-5" aria-hidden="true" />
        </span>
        {isActive && <Badge tone="primary">Ativa</Badge>}
      </div>

      {editing ? (
        <div className="mt-3 flex items-center gap-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') {
                setName(list.name);
                setEditing(false);
              }
            }}
            maxLength={60}
            aria-label="Renomear lista"
            autoFocus
          />
          <Button variant="ghost" size="sm" onClick={save} aria-label="Salvar nome">
            <Check className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setName(list.name);
              setEditing(false);
            }}
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <h2 className="mt-3 truncate text-base font-bold text-text">{list.name}</h2>
      )}

      <p className="mt-1 text-sm text-text-muted">
        {list.itemCount} {list.itemCount === 1 ? 'item' : 'itens'}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={onOpen}>
          Abrir
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          aria-label={`Renomear ${list.name}`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={!canDelete}
          aria-label={`Excluir ${list.name}`}
          className="hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}
