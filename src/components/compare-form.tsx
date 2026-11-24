"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { PLATFORM_OPTIONS, type Platform } from "@/lib/riot/config";

type Side = { platform: Platform; riotId: string };

type Props = {
  defaultPlatform: Platform;
  a?: { platform: Platform; riotId: string };
  b?: { platform: Platform; riotId: string };
};

function splitRiotId(raw: string): [string, string] | null {
  const value = raw.trim();
  const hash = value.lastIndexOf("#");
  if (hash <= 0 || hash === value.length - 1) return null;
  const name = value.slice(0, hash).trim();
  const tag = value.slice(hash + 1).trim();
  return name && tag ? [name, tag] : null;
}

export function CompareForm({ defaultPlatform, a, b }: Props) {
  const router = useRouter();
  const [left, setLeft] = useState<Side>(
    a ?? { platform: defaultPlatform, riotId: "" },
  );
  const [right, setRight] = useState<Side>(
    b ?? { platform: defaultPlatform, riotId: "" },
  );
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedLeft = splitRiotId(left.riotId);
    const parsedRight = splitRiotId(right.riotId);

    if (!parsedLeft || !parsedRight) {
      setError("Completá los dos Riot ID con su tag: por ejemplo Faker#KR1");
      return;
    }

    setError(null);
    const param = (platform: Platform, parts: [string, string]) =>
      `${platform}/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`;

    router.push(
      `/comparar?a=${param(left.platform, parsedLeft)}&b=${param(right.platform, parsedRight)}`,
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="grid items-start gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <SideFields
          label="Jugador A"
          value={left}
          onChange={setLeft}
          idPrefix="a"
        />

        <div className="hidden self-center pt-5 sm:block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            vs
          </span>
        </div>

        <SideFields
          label="Jugador B"
          value={right}
          onChange={setRight}
          idPrefix="b"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted">
          {error ? (
            <span className="text-loss">{error}</span>
          ) : (
            "Misma región o regiones distintas: el comparador resuelve cada lado."
          )}
        </p>
        <Button type="submit" size="md">
          Comparar
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </form>
  );
}

function SideFields({
  label,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  value: Side;
  onChange: (side: Side) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`${idPrefix}-riot-id`}
        className="block text-[11px] font-medium uppercase tracking-wider text-muted"
      >
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          id={`${idPrefix}-riot-id`}
          value={value.riotId}
          onChange={(event) =>
            onChange({ ...value, riotId: event.target.value })
          }
          placeholder="Nombre#TAG"
          autoComplete="off"
          spellCheck={false}
          className="h-11 flex-1 text-sm"
        />
        <Select
          aria-label={`Región de ${label}`}
          value={value.platform}
          onChange={(event) =>
            onChange({ ...value, platform: event.target.value as Platform })
          }
          className="h-11 w-28 text-xs"
        >
          {PLATFORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value.toUpperCase()}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
