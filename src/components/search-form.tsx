"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { parseRiotId } from "@/lib/search";
import type { Platform } from "@/lib/riot/config";
import { PLATFORM_OPTIONS } from "@/lib/riot/config";

type Props = {
  defaultPlatform: Platform;
  size?: "md" | "lg";
};

export function SearchForm({ defaultPlatform, size = "lg" }: Props) {
  const router = useRouter();
  const [riotId, setRiotId] = useState("");
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRiotId(riotId);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setError(null);
    router.push(
      `/perfil/${platform}/${encodeURIComponent(parsed.value.gameName)}/${encodeURIComponent(parsed.value.tagLine)}`,
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="riot-id" className="sr-only">
          Riot ID
        </label>
        <Input
          id="riot-id"
          name="riotId"
          value={riotId}
          onChange={(event) => setRiotId(event.target.value)}
          placeholder="Tu Riot ID — por ejemplo Faker#KR1"
          autoComplete="off"
          spellCheck={false}
          className="sm:flex-1"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "riot-id-error" : undefined}
        />

        <label htmlFor="platform" className="sr-only">
          Región
        </label>
        <Select
          id="platform"
          name="platform"
          value={platform}
          onChange={(event) => setPlatform(event.target.value as Platform)}
          className="sm:w-56"
        >
          {PLATFORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Button type="submit" size={size} className="sm:w-auto">
          <Search className="size-4" aria-hidden />
          Buscar
        </Button>
      </div>

      {error ? (
        <p id="riot-id-error" role="alert" className="mt-2 text-[12px] font-medium text-loss">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-dim">
          El tag son los caracteres después del #. Si no lo sabés, aparece en el
          cliente de LoL arriba de tu nombre.
        </p>
      )}
    </form>
  );
}
