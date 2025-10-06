import React, { useState } from "react";

function ClassInputForm({ onSubmit }) {
  const [count, setCount] = useState("");
  const [classes, setClasses] = useState([]);

  const generateFields = () => {
    setClasses(
      Array.from({ length: count }, () => ({
        startHour: "",
        startMinute: "",
        endHour: "",
        endMinute: ""
      }))
    );
  };

  const handleChange = (index, field, value) => {
    const updated = [...classes];
    if (field.includes("Hour")) {
      const hour = Number(value);
      if (hour >= 0 && hour <= 23) updated[index][field] = value;
    } else {
      const minute = Number(value);
      if (minute >= 0 && minute <= 59) updated[index][field] = value;
    }
    setClasses(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formatted = classes.map(cls => ({
      start: Number(cls.startHour) + Number(cls.startMinute) / 60,
      end: Number(cls.endHour) + Number(cls.endMinute) / 60
    }));
    onSubmit(formatted);
  };

  return (
    <div>
      <div>
        <label>
          Number of Classes :
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min="1"
            max="50"
            required
          />
        </label>
        <button type="button" onClick={generateFields}>
          Generate
        </button>
      </div>
      {classes.length > 0 && (
        <form onSubmit={handleSubmit}>
          {classes.map((cls, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <label>
                Class {i + 1} Start Time :
                <input
                  type="number"
                  placeholder="Hour"
                  min="0"
                  max="23"
                  value={cls.startHour}
                  onChange={e => handleChange(i, "startHour", e.target.value)}
                  required
                  style={{ width: "50px" }}
                />
                :
                <input
                  type="number"
                  placeholder="Minute"
                  min="0"
                  max="59"
                  value={cls.startMinute}
                  onChange={e => handleChange(i, "startMinute", e.target.value)}
                  required
                  style={{ width: "50px" }}
                />
              </label>
              <label style={{ marginLeft: "15px" }}>
                End Time :
                <input
                  type="number"
                  placeholder="Hour"
                  min="0"
                  max="23"
                  value={cls.endHour}
                  onChange={e => handleChange(i, "endHour", e.target.value)}
                  required
                  style={{ width: "50px" }}
                />
                :
                <input
                  type="number"
                  placeholder="Minute"
                  min="0"
                  max="59"
                  value={cls.endMinute}
                  onChange={e => handleChange(i, "endMinute", e.target.value)}
                  required
                  style={{ width: "50px" }}
                />
              </label>
            </div>
          ))}
          <button type="submit">Schedule</button>
        </form>
      )}
    </div>
  );
}

export default ClassInputForm;
