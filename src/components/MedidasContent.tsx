/** Conteúdo do guia de medidas — usado na página /medidas e no modal leve do produto. */
export const MEDIDAS = [
  { tam: "P", busto: "82–86 cm", cintura: "62–66 cm", quadril: "90–94 cm" },
  { tam: "M", busto: "87–91 cm", cintura: "67–71 cm", quadril: "95–99 cm" },
  { tam: "G", busto: "92–97 cm", cintura: "72–77 cm", quadril: "100–105 cm" },
  { tam: "GG", busto: "98–104 cm", cintura: "78–84 cm", quadril: "106–112 cm" },
];

export default function MedidasContent({
  policy,
}: {
  policy?: { title?: string; text?: string } | null;
}) {
  return (
    <>
      <p className="max-w-2xl leading-relaxed text-ink-soft">
        Meça o corpo com uma fita métrica, sem apertar, e compare com a tabela abaixo.
        Na dúvida entre dois tamanhos, recomendamos o maior — ou chame a gente no
        WhatsApp que ajudamos a escolher.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/60 text-left text-[11px] uppercase tracking-widest text-ink-soft">
              <th className="px-6 py-4">Tamanho</th>
              <th className="px-6 py-4">Busto</th>
              <th className="px-6 py-4">Cintura</th>
              <th className="px-6 py-4">Quadril</th>
            </tr>
          </thead>
          <tbody>
            {MEDIDAS.map((m) => (
              <tr key={m.tam} className="border-b border-line/60 last:border-0">
                <td className="px-6 py-4 font-display text-lg text-ink">{m.tam}</td>
                <td className="px-6 py-4 text-ink-soft">{m.busto}</td>
                <td className="px-6 py-4 text-ink-soft">{m.cintura}</td>
                <td className="px-6 py-4 text-ink-soft">{m.quadril}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {policy?.text && (
        <div className="mt-8 border-t border-line pt-6">
          <h2 className="font-display text-xl text-ink">
            {(policy.title as string) || "Política de trocas"}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{policy.text}</p>
        </div>
      )}
    </>
  );
}
