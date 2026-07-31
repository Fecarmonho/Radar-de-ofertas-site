/**
 * Comprime uma imagem no próprio navegador (redimensiona pro tamanho
 * máximo indicado e reduz a qualidade JPEG) e devolve como base64 —
 * pra guardar direto no Firestore, sem precisar de um serviço de
 * armazenamento de arquivos separado (Storage/Blaze).
 *
 * Um produto comprimido assim costuma ficar entre 20-80KB, bem dentro
 * do limite de 1MB por documento do Firestore.
 */
export function compressImageToBase64(
  file: File,
  maxSide = 640,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Arquivo não é uma imagem."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round(height * (maxSide / width));
            width = maxSide;
          } else {
            width = Math.round(width * (maxSide / height));
            height = maxSide;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Não foi possível ler essa imagem."));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Não foi possível ler esse arquivo."));
    reader.readAsDataURL(file);
  });
}
