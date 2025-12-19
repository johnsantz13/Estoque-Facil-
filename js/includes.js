// includes.js - carrega partials HTML e injeta em elementos com data-include
document.addEventListener('DOMContentLoaded', async () => {
    const includes = Array.from(document.querySelectorAll('[data-include]'));
    // Carrega cada include sequencialmente para evitar condições de corrida
    for (const el of includes) {
        const name = el.getAttribute('data-include');
        try {
            const res = await fetch(`/partials/${name}.html`);
            if (!res.ok) throw new Error('Failed to load partial: ' + name);
            const html = await res.text();
            el.innerHTML = html;

            // Dispara evento customizado informando que o partial foi carregado
            document.dispatchEvent(new CustomEvent('partial:loaded', { detail: { name, element: el } }));

            // Executa scripts inline presentes no partial (se houver)
            el.querySelectorAll('script').forEach(oldScript => {
                const script = document.createElement('script');
                if (oldScript.src) script.src = oldScript.src;
                else script.textContent = oldScript.textContent;
                document.body.appendChild(script);
                oldScript.remove();
            });
        } catch (err) {
            console.error(err);
            el.innerHTML = `<!-- Erro ao carregar partial: ${name} -->`;
        }
    }
});
