import { useEffect, useState } from 'react';
import { formatPoDate, parsePoDateInput } from '../../../Utils/formatters';

export default function PoDateInput({
  id,
  value,
  onChange,
  error,
  placeholder = 'DD-Mon-YYYY',
}) {
  const [displayValue, setDisplayValue] = useState(() => (
    value ? formatPoDate(value) : ''
  ));

  useEffect(() => {
    setDisplayValue(value ? formatPoDate(value) : '');
  }, [value]);

  const handleChange = (event) => {
    setDisplayValue(event.target.value);
  };

  const handleBlur = () => {
    if (!displayValue.trim()) {
      onChange('');
      return;
    }

    const parsed = parsePoDateInput(displayValue);

    if (!parsed) {
      onChange(value || '');
      setDisplayValue(value ? formatPoDate(value) : '');
      return;
    }

    onChange(parsed);
    setDisplayValue(formatPoDate(parsed));
  };

  return (
    <>
      <input
        id={id}
        type="text"
        className="po-management__input"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="off"
      />
      {error && <p className="po-management__error">{error}</p>}
    </>
  );
}
