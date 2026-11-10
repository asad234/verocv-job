import React, { useState } from "react";

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getWeekNumber = (year: number, month: number, day: number) => {
  const date = new Date(year, month, day);
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
};

const Calendar: React.FC = () => {
  const [year, setYear] = useState(2026);
  const [showWeeks, setShowWeeks] = useState(true);

  const vacations = [
    { month: 1, days: [5, 6, 7, 8, 9, 10, 11, 12] },
    { month: 6, days: [10, 11, 12, 13, 14, 15, 16] }
  ];
  const booked = [
    { month: 2, days: [3, 4, 5, 6, 7, 8, 9] }
  ];

  const isVacation = (month: number, day: number) => {
    return vacations.some(v => v.month === month && v.days.includes(day));
  };

  const isBooked = (month: number, day: number) => {
    return booked.some(b => b.month === month && b.days.includes(day));
  };

  return (
    <div className="p-4">
      <div className="flex justify-center items-center gap-4 mb-4">
        <button onClick={() => setYear(year - 1)} className="p-2 border rounded">&lt;</button>
        <h2 className="text-xl font-bold">{year}</h2>
        <button onClick={() => setYear(year + 1)} className="p-2 border rounded">&gt;</button>
      </div>
      <label className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={showWeeks} onChange={() => setShowWeeks(!showWeeks)} /> Visa veckonummer
      </label>
      <div className="overflow-x-auto border p-2 rounded-lg shadow">
        <div className="grid grid-cols-[auto_repeat(31,_1fr)] text-center text-sm font-semibold border-b">
          {showWeeks && <div className="p-2 border-r">Vecka</div>}
          <div className="p-2 border-r">Må</div>
          {[...Array(31)].map((_, day) => (
            <div key={day} className="p-2 border-r">{day + 1}</div>
          ))}
        </div>
        {months.map((month, index) => (
          <div key={index} className="grid grid-cols-[auto_repeat(31,_1fr)] text-center text-sm border-b">
            {showWeeks && <div className="p-2 border-r">{getWeekNumber(year, index, 1)}</div>}
            <div className="p-2 border-r font-semibold">{month}</div>
            {[...Array(31)].map((_, day) => {
              const dayNum = day + 1;
              return (
                <div
                  key={dayNum}
                  className={`p-2 border-r ${isVacation(index + 1, dayNum)
                    ? "bg-red-400"
                    : isBooked(index + 1, dayNum)
                      ? "bg-green-400"
                      : "bg-white"
                    }`}
                >
                  {dayNum <= getDaysInMonth(year, index) ? dayNum : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border"></div> Available
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400"></div> Vacation
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400"></div> Booked
        </div>
      </div>
    </div>
  );
};

export default Calendar;
