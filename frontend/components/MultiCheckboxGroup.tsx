"use client";

import styles from "./multi-checkbox-group.module.css";

type Option = { value: string; label: string };

type Props = {
  legend: string;
  hint?: string;
  options: Option[];
  values: string[];
  max?: number;
  onChange: (values: string[]) => void;
  invalid?: boolean;
};

export function MultiCheckboxGroup({ legend, hint, options, values, max, onChange, invalid }: Props) {
  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
      return;
    }
    if (max && values.length >= max) return;
    onChange([...values, value]);
  };

  const atMax = max ? values.length >= max : false;

  return (
    <fieldset className={`${styles.fieldset} ${invalid ? styles.fieldsetInvalid : ""}`}>
      <legend className={styles.legend}>{legend}</legend>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      <div className={styles.grid}>
        {options.map((opt) => {
          const checked = values.includes(opt.value);
          const disabled = !checked && atMax;
          return (
            <label key={opt.value} className={`${styles.option} ${disabled ? styles.optionDisabled : ""}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
      {max ? (
        <p className={styles.counter}>
          {values.length}/{max} seleccionados
        </p>
      ) : null}
    </fieldset>
  );
}
