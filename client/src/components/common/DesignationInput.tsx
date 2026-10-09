import React, { useEffect, useState, useRef } from "react";
import { getDesignations, type Designation } from "../../services/designationService";
import { Edit3, List } from "lucide-react";

interface DesignationInputProps {
  value: string;
  onChange: (value: string) => void;
  departmentId?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export const DesignationInput: React.FC<DesignationInputProps> = ({
  value,
  onChange,
  departmentId,
  disabled = false,
  required = false,
  id = "designation-input",
}) => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [allDesignations, setAllDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isManual, setIsManual] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all designations once for datalist/fallback (keep limit <= 100)
  useEffect(() => {
    let isMounted = true;
    getDesignations({ status: "ACTIVE", limit: 100 })
      .then((res) => {
        if (isMounted) {
          setAllDesignations(res.data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load designations:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // When department changes, update department-specific designations
  useEffect(() => {
    let isMounted = true;
    if (departmentId) {
      setLoading(true);
      getDesignations({ departmentId, status: "ACTIVE", limit: 100 })
        .then((res) => {
          if (isMounted) {
            setDesignations(res.data || []);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load department designations:", err);
          if (isMounted) {
            setDesignations([]);
            setLoading(false);
          }
        });
    } else {
      setDesignations([]);
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [departmentId]);

  // Determine active choices: if department has designations, use those; otherwise use all active
  const availableList =
    designations.length > 0 ? designations : allDesignations;

  const isValueInList = availableList.some(
    (d) => d.name.toLowerCase() === (value || "").toLowerCase()
  );

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__MANUAL_ENTRY__") {
      setIsManual(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      onChange(selected);
    }
  };

  const handleManualToggle = (manual: boolean) => {
    setIsManual(manual);
    if (manual) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1px",
        }}
      >
        <button
          type="button"
          onClick={() => handleManualToggle(!isManual)}
          disabled={disabled}
          style={{
            background: "none",
            border: "none",
            color: "#4f46e5",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 0",
          }}
          title={isManual ? "Switch to dropdown selection" : "Switch to custom typing"}
        >
          {isManual ? (
            <>
              <List size={13} /> Select from List
            </>
          ) : (
            <>
              <Edit3 size={13} /> Type Manually
            </>
          )}
        </button>
      </div>

      {isManual ? (
        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={required}
            placeholder="Type designation (e.g. Senior Software Engineer)..."
            list={`${id}-datalist`}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              color: "#0f172a",
              background: "#ffffff",
              outline: "none",
            }}
          />
          <datalist id={`${id}-datalist`}>
            {allDesignations.map((d) => (
              <option key={d._id} value={d.name}>
                {d.code ? `${d.name} (${d.code})` : d.name}
              </option>
            ))}
          </datalist>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <select
            id={id}
            value={value}
            onChange={handleSelectChange}
            disabled={disabled}
            required={required}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              color: "#0f172a",
              background: "#ffffff",
              outline: "none",
            }}
          >
            <option value="">
              {loading
                ? "Loading designations..."
                : "-- Select Designation --"}
            </option>

            {/* If there's a custom value not in current list, keep it accessible */}
            {value && !isValueInList && (
              <option value={value}>
                {value}
              </option>
            )}

            {availableList.map((d) => (
              <option key={d._id} value={d.name}>
                {d.name} {d.code ? `(${d.code})` : ""}
              </option>
            ))}

            <option
              value="__MANUAL_ENTRY__"
              style={{ fontWeight: 700, color: "#4f46e5" }}
            >
              ✍️ + Type custom designation manually...
            </option>
          </select>
        </div>
      )}
    </div>
  );
};
export default DesignationInput;
