/**
 * Processamento de imagem no cliente — para a foto do produto no catálogo.
 *
 * Lê um arquivo de imagem, redimensiona (canvas) e re-codifica como JPEG data URL.
 * Isso mantém o tamanho pequeno (cabe no localStorage do mock) e, como passo de
 * segurança, a re-codificação via canvas descarta qualquer conteúdo que não seja
 * imagem de fato.
 *
 * SECURITY: além disso, validamos tipo (image/*) e tamanho. O `safeUrl()` permite
 * apenas `data:image/*`, então o data URL resultante é seguro para usar em <img>.
 */

const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB antes de comprimir

export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 512,
  quality = 0.8,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Imagem muito grande (máximo 8 MB).');
  }

  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem.');

  // Fundo branco (JPEG não tem transparência).
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
    img.src = src;
  });
}
