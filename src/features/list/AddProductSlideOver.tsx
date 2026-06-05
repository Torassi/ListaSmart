/**
 * AddProductSlideOver — cadastro manual de produto + preço.
 *
 * Form validado com react-hook-form + zod (`productPriceSchema`). Ao salvar,
 * adiciona o item à lista e registra o preço informado para o mercado escolhido.
 * SECURITY: validação no cliente é só UX; o servidor deve revalidar.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input, Select, SlideOver } from '@/components';
import { PRODUCT_CATEGORIES, productPriceSchema } from '@/lib/validation';
import type { ProductPriceInput } from '@/lib/validation';
import { useToast } from '@/hooks/useToast';
import { useList } from './ListContext';
import type { Market } from '@/types';

interface AddProductSlideOverProps {
  open: boolean;
  onClose: () => void;
  markets: Market[];
}

export function AddProductSlideOver({ open, onClose, markets }: AddProductSlideOverProps) {
  const { addManualItem } = useList();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductPriceInput>({
    resolver: zodResolver(productPriceSchema),
    defaultValues: { name: '', category: undefined, quantity: 1, marketId: '', price: undefined },
  });

  function onSubmit(values: ProductPriceInput) {
    addManualItem(values);
    toast(`${values.name} adicionado à lista`, 'success');
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Adicionar produto"
      description="Cadastre um produto e registre o preço em um mercado."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" form="add-product-form" isLoading={isSubmitting}>
            Adicionar à lista
          </Button>
        </div>
      }
    >
      <form id="add-product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Field label="Produto" error={errors.name?.message} required>
          {({ id, describedBy }) => (
            <Input
              id={id}
              placeholder="Ex.: Arroz integral 1kg"
              hasError={!!errors.name}
              aria-describedby={describedBy}
              {...register('name')}
            />
          )}
        </Field>

        <Field label="Categoria" error={errors.category?.message} required>
          {({ id, describedBy }) => (
            <Select id={id} hasError={!!errors.category} aria-describedby={describedBy} {...register('category')}>
              <option value="">Selecione...</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Quantidade" error={errors.quantity?.message} required>
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="number"
              min={1}
              max={999}
              hasError={!!errors.quantity}
              aria-describedby={describedBy}
              {...register('quantity')}
            />
          )}
        </Field>

        <Field label="Mercado" error={errors.marketId?.message} required>
          {({ id, describedBy }) => (
            <Select id={id} hasError={!!errors.marketId} aria-describedby={describedBy} {...register('marketId')}>
              <option value="">Selecione...</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Preço (R$)" error={errors.price?.message} required>
          {({ id, describedBy }) => (
            <Input
              id={id}
              type="number"
              step="0.01"
              min={0}
              placeholder="0,00"
              hasError={!!errors.price}
              aria-describedby={describedBy}
              {...register('price')}
            />
          )}
        </Field>
      </form>
    </SlideOver>
  );
}
