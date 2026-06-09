    const rangeSelect = document.getElementById("rangeSelect");
    const startDateInput = document.getElementById("Date1");
    const endDateInput = document.getElementById("Date2");

function formatDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
    }

    function getWeekRange(offsetWeeks = 0) {
      const today = new Date();
      const day = today.getDay(); // 0 (Sun) to 6 (Sat)
      const monday = new Date(today);
      const diffToMonday = day === 0 ? -6 : 1 - day;
      monday.setDate(today.getDate() + diffToMonday + offsetWeeks * 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return [monday, sunday];
    }

    function getMonthRange(offsetMonths = 0) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + offsetMonths;

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return [firstDay, lastDay];
    }

    function getYTDRange() {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = now;
      return [start, end];
    }

    rangeSelect.addEventListener("change", () => {
      const selected = rangeSelect.value;
      let start, end;
      const today = new Date();

      switch (selected) {
        case "today":
          start = end = today;
          break;
        case "tomorrow":
          start = end = new Date(today.setDate(today.getDate() + 1));
          break;
        case "yesterday":
          start = end = new Date(today.setDate(today.getDate() - 1));
          break;
        case "thisWeek":
          [start, end] = getWeekRange(0);
          break;
        case "lastWeek":
          [start, end] = getWeekRange(-1);
          break;
		case "nextWeek":
  		  [start, end] = getWeekRange(1);
  		  break;          
        case "thisMonth":
          [start, end] = getMonthRange(0);
          break;
        case "lastMonth":
          [start, end] = getMonthRange(-1);
          break;
        case "nextMonth":
          [start, end] = getMonthRange(1);
          break;
	case "lastYear":
case "lastYear":
  start = new Date(today.getFullYear() - 1, 0, 1);   // Jan 1 last year
  end   = new Date(today.getFullYear() - 1, 11, 31); // Dec 31 last year
  break;
        case "ytd":
          [start, end] = getYTDRange();
          break;
        default:
          return;
      }

      startDateInput.value = formatDate(start);
      endDateInput.value = formatDate(end);
    });