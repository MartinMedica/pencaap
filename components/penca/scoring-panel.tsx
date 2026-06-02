import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rules = [
  ["Resultado exacto", "+5"],
  ["Ganador o empate", "+3"],
  ["Goles de cada equipo", "+1 c/u"],
  ["Clasificado en eliminatorias", "+3"]
];

export function ScoringPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Como se puntua</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rules.map(([label, points]) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-md bg-[#f2f5ee] px-3 py-2">
              <span className="text-sm font-semibold text-[#586257]">{label}</span>
              <span className="text-base font-black text-pitch">{points}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
