export async function uploadCmsImage(file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  const res = await fetch("/api/cms/upload", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Upload falhou");
  }
  if (!data.url) throw new Error("Resposta inválida");
  return data.url;
}
