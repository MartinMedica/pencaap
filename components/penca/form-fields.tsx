"use client";

import { teamName, teams } from "@/lib/fixture";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
};

export function TextField({ label, value, onChange, placeholder, type = "text" }: TextFieldProps) {
  return (
    <Label>
      {label}
      <Input className="mt-1" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </Label>
  );
}

type ScoreFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ScoreField({ label, value, onChange, disabled }: ScoreFieldProps) {
  return (
    <Label>
      <span className="block truncate text-xs">{label}</span>
      <Input
        className="mt-1 px-2 text-center font-bold"
        type="number"
        min={0}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </Label>
  );
}

type TeamSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  disabled?: boolean;
  allowEmpty?: boolean;
};

export function TeamSelect({ label, value, onChange, options = teams.map((team) => team.id), disabled, allowEmpty }: TeamSelectProps) {
  return (
    <Label>
      {label}
      <Select className="mt-1" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {allowEmpty ? <option value="">Por definir</option> : null}
        {options.map((id) => (
          <option key={id} value={id}>
            {teamName(id)}
          </option>
        ))}
      </Select>
    </Label>
  );
}
