/** Helpers de download de arquivos gerados no navegador. */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Entrega o arquivo ao usuário. No celular tenta o compartilhamento nativo
 * (que oferece "Salvar em Arquivos") e cai no download comum se não der.
 */
export async function deliverFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  downloadBlob(blob, filename);
}
