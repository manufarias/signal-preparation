// src/hooks/useSignalEpisode.ts

import { useState, useEffect, useCallback } from "react";
import { fhirClient } from "../api/fhir";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SignalComponents {
  location: string;
  sensation: string;
  pattern: string;
  intensity: string;
  since: string;
}

export type ComponentKey = keyof SignalComponents;

export interface SignalICE {
  thinks: string;
  worries: string;
  expects: string;
}

export interface SignalObservation {
  id: string;
  observationNumber: number;
  effectiveDateTime: string;
  components: SignalComponents;
  patientVoice: string;
  algorithmOutput: string;
  ice: SignalICE;
  photos: string[];
}

export interface SignalDelta {
  field: ComponentKey;
  label: string;
  previous: string;
  current: string;
  changed: boolean;
}

export interface SignalEpisode {
  episodeId: string;
  algorithmOutput: string;
  patientVoice: string;
  ice: SignalICE;
  observations: SignalObservation[];
  deltas: SignalDelta[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXT = {
  episodeId: "https://signal.health/episode-id",
  algorithmOutput: "https://signal.health/algorithm-output",
  observationNumber: "https://signal.health/observation-number",
  patientVoice: "https://signal.health/patient-voice",
  iceThinks: "https://signal.health/ice-thinks",
  iceWorries: "https://signal.health/ice-worries",
  iceExpects: "https://signal.health/ice-expects",
} as const;

const COMPONENT_LABELS: Record<ComponentKey, string> = {
  location: "Location",
  sensation: "Sensation",
  pattern: "Pattern",
  intensity: "Intensity",
  since: "Since",
};

// ─── Parsers ──────────────────────────────────────────────────────────────────

function extStr(extensions: any[], url: string): string {
  return extensions?.find((e: any) => e.url === url)?.valueString ?? "";
}

function extInt(extensions: any[], url: string): number {
  return extensions?.find((e: any) => e.url === url)?.valueInteger ?? 0;
}

function parseComponents(resource: any): SignalComponents {
  const comps = resource.component ?? [];
  const get = (text: string) =>
    comps.find((c: any) => c.code?.text === text)?.valueString ?? "";
  return {
    location: get("location"),
    sensation: get("sensation"),
    pattern: get("pattern"),
    intensity: get("intensity"),
    since: get("since"),
  };
}

function parseObservation(resource: any): SignalObservation | null {
  const ext = resource.extension ?? [];
  const episodeId = extStr(ext, EXT.episodeId);
  if (!episodeId) return null;

  return {
    id: resource.id ?? "",
    observationNumber: extInt(ext, EXT.observationNumber) || 1,
    effectiveDateTime: resource.effectiveDateTime ?? "",
    components: parseComponents(resource),
    patientVoice: extStr(ext, EXT.patientVoice),
    algorithmOutput: extStr(ext, EXT.algorithmOutput),
    ice: {
      thinks: extStr(ext, EXT.iceThinks),
      worries: extStr(ext, EXT.iceWorries),
      expects: extStr(ext, EXT.iceExpects),
    },
    photos: (resource.component ?? [])
      .filter((c: any) => c.code?.text === "photo" && c.valueString)
      .map((c: any) => c.valueString as string),
  };
}

function computeDeltas(
  first: SignalObservation,
  latest: SignalObservation,
): SignalDelta[] {
  const fields: ComponentKey[] = [
    "location",
    "sensation",
    "pattern",
    "intensity",
    "since",
  ];
  return fields.map((field) => ({
    field,
    label: COMPONENT_LABELS[field],
    previous: first.components[field],
    current: latest.components[field],
    changed: first.components[field] !== latest.components[field],
  }));
}

function groupIntoEpisodes(resources: any[]): SignalEpisode[] {
  const map = new Map<string, SignalObservation[]>();

  for (const resource of resources) {
    const obs = parseObservation(resource);
    if (!obs) continue;
    const episodeId = extStr(resource.extension ?? [], EXT.episodeId);
    if (!map.has(episodeId)) map.set(episodeId, []);
    map.get(episodeId)!.push(obs);
  }

  const episodes: SignalEpisode[] = [];

  for (const [episodeId, observations] of map.entries()) {
    const sorted = [...observations].sort(
      (a, b) => a.observationNumber - b.observationNumber,
    );
    const latest = sorted[sorted.length - 1];
    const deltas = sorted.length >= 2 ? computeDeltas(sorted[0], latest) : [];

    episodes.push({
      episodeId,
      algorithmOutput: latest.algorithmOutput,
      patientVoice: latest.patientVoice,
      ice: latest.ice,
      observations: sorted,
      deltas,
    });
  }

  return episodes;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseSignalEpisodeResult {
  episodes: SignalEpisode[];
  hasSignal: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSignalEpisode(
  patientId: string | null | undefined,
): UseSignalEpisodeResult {
  const [episodes, setEpisodes] = useState<SignalEpisode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!patientId) {
      setEpisodes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try with pipe format first — standard FHIR _tag filter
      const { data } = await fhirClient.get<any>("/Observation", {
        params: {
          subject: `Patient/${patientId}`,
          _tag: "https://signal.health|signal-episode",
          _sort: "date",
          _count: 50,
        },
      });

      const resources = (data.entry ?? []).map((e: any) => e.resource);

      setEpisodes(groupIntoEpisodes(resources));
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch Signal episodes");
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    episodes,
    hasSignal: episodes.length > 0,
    loading,
    error,
    refetch: fetch,
  };
}
