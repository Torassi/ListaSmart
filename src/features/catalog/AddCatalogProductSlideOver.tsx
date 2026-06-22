/**
 * AddCatalogProductSlideOver — cadastro manual de um produto no catálogo.
 *
 * Form validado com react-hook-form + zod (`catalogProductSchema`). Ao salvar,
 * o produto passa a aparecer na grid da Home e fica disponível para as listas.
 * SECURITY: validação no cliente é só UX; o servidor deve revalidar e deduplicar.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, X } from 'lucide-react';
import { Button, Field, Input, Select, SlideOver } from '@/components';
import { catalogProductSchema, PRODUCT_CATEGORIES } from '@/lib/validation';
import type { CatalogProductInput } from '@/lib/validation';
import { fileToCompressedDataUrl } from '@/lib/image';
import { useToast } from '@/hooks/useToast';
import { useCatalogStore } from './CatalogContext';
import type { Market } from '@/types';

interface AddCatalogProductSlideOverProps {
  open: boolean;
  onClose: () => void;
  markets: Market[];
}

export function AddCatalogProductSlideOver({ open, onClose, markets }: AddCatalogProductSlideOverProps) {
  const { addProduct } = useCatalogStore();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CatalogProductInput>({
    resolver: zodResolver(catalogProductSchema),
    defaultValues: { name: '', category: undefined, unit: '', barcode: '', marketId: '', price: undefined },
  });

  function clearImage() {
    setImageUrl(null);
    setImageError(null);
  }

  function close() {
    reset();
    clearImage();
    onClose();
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-selecionar o mesmo arquivo
    if (!file) return;
    setImageError(null);
    setProcessingImage(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setImageUrl(dataUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Não foi possível usar esta imagem.');
    } finally {
      setProcessingImage(false);
    }
  }

  async function onSubmit(values: CatalogProductInput) {
    // Aguarda a API (POST /products). Só fecha/limpa no sucesso; em erro
    // (ex.: código de barras duplicado) mantém o form aberto com os dados.
    // `isSubmitting` bloqueia envio duplicado durante o await.
    try {
      await addProduct(values, imageUrl ?? undefined);
      toast(`${values.name} adicionado ao catálogo`, 'success');
      close();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Não foi possível adicionar ao catálogo.',
        'error',
      );
    }
  }

  return (
    <SlideOver
      open={open}
      onClose={close}
      title="Adicionar ao catálogo"
      description="Cadastre um novo produto e um preço inicial em um mercado."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="add-catalog-form"
            isLoading={isSubmitting}
            disabled={processingImage || isSubmitting}
          >
            Adicionar ao catálogo
          </Button>
        </div>
      }
    >
      <form id="add-catalog-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {/* Foto do produto (opcional) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Foto do produto</span>
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Pré-visualização do produto"
                  className="h-20 w-20 rounded-md border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remover foto"
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-surface text-text-muted shadow-card hover:text-danger"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-text-subtle hover:border-primary hover:text-primary">
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px]">{processingImage ? '...' : 'Enviar'}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
              </label>
            )}
            <p className="text-xs text-text-subtle">
              Opcional. JPG/PNG; a imagem é redimensionada automaticamente.
            </p>
          </div>
          {imageError && (
            <p role="alert" className="text-xs font-medium text-danger">
              {imageError}
            </p>
          )}
        </div>

        <Field label="Produto" error={errors.name?.message} required>
          {({ id, describedBy }) => (
            <Input
              id={id}
              placeholder="Ex.: Arroz integral"
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

        <Field label="Unidade" error={errors.unit?.message} hint="Ex.: 1 kg, 500 g, unidade." required>
          {({ id, describedBy }) => (
            <Input
              id={id}
              placeholder="1 kg"
              hasError={!!errors.unit}
              aria-describedby={describedBy}
              {...register('unit')}
            />
          )}
        </Field>

        <Field label="Código de barras" error={errors.barcode?.message} hint="Opcional (8 a 14 dígitos).">
          {({ id, describedBy }) => (
            <Input
              id={id}
              inputMode="numeric"
              placeholder="7891000000000"
              hasError={!!errors.barcode}
              aria-describedby={describedBy}
              {...register('barcode')}
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
