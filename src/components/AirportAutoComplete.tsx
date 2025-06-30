import React, { useState, useRef, useEffect } from "react";
import "./AirportAutoComplete.css";

interface Airport {
  name: string;
  city: string;
  country: string;
  iata: string;
  lat: number;
  lon: number;
}

interface Props {
  airports: Record<string, Airport>;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const AirportAutoComplete: React.FC<Props> = ({
  airports,
  label,
  value,
  onChange,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    onChange(input);

    if (!input) {
      setSuggestions([]);
      return;
    }

    const filtered = Object.keys(airports)
      .filter((code) => {
        const ap = airports[code];
        return (
          code.includes(input) ||
          ap.name.toUpperCase().includes(input) ||
          ap.city.toUpperCase().includes(input)
        );
      })
      .slice(0, 8); // limit results

    setSuggestions(filtered);
  };

  const handleSelect = (code: string) => {
    onChange(code);
    setSuggestions([]);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="autocomplete-container" ref={containerRef}>
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder="Start typing airport name, code, or city"
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((code) => (
            <li
              key={code}
              onClick={() => handleSelect(code)}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur on click
            >
              {code} - {airports[code].name} ({airports[code].city})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AirportAutoComplete;
