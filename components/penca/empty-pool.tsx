import { Card, CardContent } from "@/components/ui/card";

export function EmptyPool() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <h2 className="text-2xl font-bold">Crea o unite a una penca</h2>
        <p className="mx-auto mt-2 max-w-md text-[#68736a]">Cuando tengas una penca activa vas a ver fixture, predicciones, admin y ranking.</p>
      </CardContent>
    </Card>
  );
}
