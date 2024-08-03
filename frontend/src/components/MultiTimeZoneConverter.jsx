
import React, { useState, useEffect } from "react"; // Importing React and hooks for state management and side effects
import moment from "moment-timezone"; // Importing moment-timezone for time manipulation and formatting
import Slider from "react-slider"; // Importing Slider component for range selection
import Select from "react-select"; // Importing Select component for dropdowns
import DatePicker from "react-datepicker"; // Importing DatePicker for date selection
import { FaCalendarAlt } from "react-icons/fa"; // Calendar icon
import { RiDraggable } from "react-icons/ri"; // Draggable icon
import { FaCalendarMinus } from "react-icons/fa"; // Calendar minus icon
import { BiSortAlt2 } from "react-icons/bi"; // Sort icon
import { FaLink } from "react-icons/fa"; // Link icon
import { MdDarkMode } from "react-icons/md"; // Dark mode icon
import { MdLightMode } from "react-icons/md"; // Light mode icon

// Importing utilities and components from @dnd-kit for drag and drop functionality
import {
  SortableContext, // Context for sortable items
  useSortable, // Hook to make components sortable
  arrayMove, // Utility to move items in an array
  verticalListSortingStrategy, // Strategy for vertical list sorting
} from "@dnd-kit/sortable";

import { DndContext, closestCorners } from "@dnd-kit/core"; // Context and utilities for drag and drop
import { CSS } from "@dnd-kit/utilities"; // Utility for styling transforms
import "react-datepicker/dist/react-datepicker.css"; // Importing DatePicker styles
import '../styles/MultiTimeZoneConverter.css' // Importing custom styles

// Function to generate initial times for default time zones
const generateInitialTimes = () => ({
  "Asia/Kolkata": moment().tz("Asia/Kolkata").format("HH:mm"), // Get current time in Kolkata
  UTC: moment().tz("UTC").format("HH:mm"), // Get current UTC time
});

// Function to generate initial time zones for dropdown
const generateInitialTimezones = () => ({
  "Asia/Kolkata": "Asia/Kolkata", // Default to Kolkata
  UTC: "UTC", // Default to UTC
});

// Function to generate marks for the time slider
function generateSliderMarks() {
  const marks = [];
  const numMarks = 25; // Total number of marks

  const markSpacing = 1440 / (numMarks - 1); // Calculate spacing between marks
  for (let i = 0; i < numMarks; i++) {
    const markPosition = i * markSpacing; // Calculate position of each mark
    marks.push(markPosition);
  }

  return marks;
}

// Function to get the abbreviation of a time zone
const getTimezoneAbbr = (zone) => {
  return moment.tz(zone).format("z"); // Format timezone abbreviation
};

// Function to get the GMT offset of a time zone
const getTimezoneOffset = (zone) => {
  const offset = moment.tz(zone).format("Z"); // Format timezone offset
  return `GMT ${offset}`; // Return formatted offset
};

// Function to generate time options for the Select component
const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 96; i++) { // Loop through 15-minute intervals
    const hour = Math.floor(i / 4); // Calculate hour
    const minute = (i % 4) * 15; // Calculate minute
    const time = moment() // Format time
      .startOf("day")
      .add(hour, "hours")
      .add(minute, "minutes")
      .format("h:mm A");
    options.push({
      value: `${hour}:${minute < 10 ? "0" : ""}${minute}`, // Add leading zero to minutes if needed
      label: time, // Label for display
    });
  }
  return options;
};


const MultiTimeZoneConverter = () => {
// State variables with default values
const [selectedTimes, setSelectedTimes] = useState(generateInitialTimes()); // Holds the selected times for each timezone
const [selectedDate, setSelectedDate] = useState(new Date()); // Holds the currently selected date
const [reverseOrder, setReverseOrder] = useState(false); // Determines whether the timezones should be displayed in reverse order
const [timezones, setTimezones] = useState(generateInitialTimezones()); // Holds the list of timezones being displayed
const [isDark, setIsDark] = useState( // Holds the dark mode status, initialized from local storage or defaults to false
  () => JSON.parse(localStorage.getItem("isDark")) || false
);
const [isSharing, setIsSharing] = useState(false); // Tracks if the sharing functionality is enabled

console.log("selectedTimes", selectedTimes); // Logs the current state of selectedTimes to the console

useEffect(() => {
  localStorage.setItem("isDark", JSON.stringify(isDark)); // Updates local storage whenever the dark mode state changes
}, [isDark]);

// Function to open Google Calendar for creating a new event
const handleBookGoogleMeet = () => {
  window.open("https://calendar.google.com/calendar/u/0/r/eventedit", "_blank", "noopener,noreferrer"); // Opens a new window or tab for Google Calendar
};

// Function to handle date change
const handleDateChange = (date) => {
  setSelectedDate(date); // Updates the selected date state
};

// Function to handle time change for a specific timezone
const handleTimeChange = (zone, value) => {
  const updatedDateTime = moment(selectedDate) // Creates a moment object for the selected date
    .startOf("day")
    .add(value, "minutes")
    .format("YYYY-MM-DD HH:mm"); // Formats the time for the updated date
  const updatedTimes = {
    ...selectedTimes, // Copies existing selected times
    [zone]: moment(updatedDateTime).format("HH:mm"), // Updates time for the specific timezone
  };

  Object.keys(timezones).forEach((tz) => { // Loops through all timezones
    if (tz !== zone) {
      updatedTimes[tz] = moment
        .tz(updatedDateTime, timezones[zone]) // Converts time to other timezones
        .tz(timezones[tz])
        .format("HH:mm"); // Formats converted time
    }
  });

  setSelectedTimes(updatedTimes); // Updates state with the new times
};

// Function to add a new timezone
const addNewTimezone = (option) => {
  const label = option.value; // Gets the value of the selected option
  const zone = label.replace(/\//g, "-"); // Replaces slashes with dashes in the timezone string
  setTimezones({ ...timezones, [zone]: label }); // Adds the new timezone to the state
  setSelectedTimes({
    ...selectedTimes, // Copies existing selected times
    [zone]: moment().tz(label).format("HH:mm"), // Sets the current time for the new timezone
  });
};

// Function to remove a timezone
const removeTimezone = (zone) => {
  const newTimezones = { ...timezones }; // Creates a copy of the current timezones
  delete newTimezones[zone]; // Removes the specified timezone
  const newSelectedTimes = { ...selectedTimes }; // Creates a copy of the current selected times
  delete newSelectedTimes[zone]; // Removes the time for the specified timezone
  setSelectedTimes(newSelectedTimes); // Updates state with the remaining times
  setTimezones(newTimezones); // Updates state with the remaining timezones
};

// Generates a list of all available timezones
const allTimezones = moment.tz
  .names()
  .map((tz) => ({ value: tz, label: tz })); // Maps timezones to an array of objects for selection

const timeOptions = generateTimeOptions(); // Generates time options for selection

// Function to reverse the order of timezones
const reverseTimezones = () => {
  setReverseOrder(!reverseOrder); // Toggles the reverseOrder state
};

// Handles the end of a drag event
const onDragEnd = ({ active, over }) => {
  if (active.id !== over.id) { // Checks if the drag has moved an item
    const oldIndex = timezoneEntries.findIndex(
      ([zone]) => zone === active.id // Finds the index of the dragged item
    );
    const newIndex = timezoneEntries.findIndex(([zone]) => zone === over.id); // Finds the new index for the dragged item

    const reorderedEntries = arrayMove(timezoneEntries, oldIndex, newIndex); // Reorders the entries
    setSelectedTimes(Object.fromEntries(reorderedEntries)); // Updates the state with the new order
  }
};

let timezoneEntries = Object.entries(selectedTimes); // Converts selected times object into an array of entries

if (reverseOrder) {
  timezoneEntries = timezoneEntries.reverse(); // Reverses the order of entries if reverseOrder is true
}




// SubContainer component that handles displaying and interacting with timezones
const SubContainer = ({ zone, time }) => {
  // State for local time in minutes based on the provided time
  const [localTime, setLocalTime] = useState(
    moment.duration(time, "HH:mm").asMinutes()
  );

  // Hook from 'useSortable' for drag-and-drop functionality
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: zone });

  // Style object for transforming the component during drag-and-drop
  const style = { transform: CSS.Transform.toString(transform), transition };

  // Handler for slider changes
  const handleSliderChange = (value) => {
    setLocalTime(value); // Updates localTime state with the new value
  };

  // Handler for when the slider change is complete
  const handleSliderChangeComplete = (value) => {
    handleTimeChange(zone, value); // Calls the handleTimeChange function to update the global time
  };

  // Handler for time selection changes
  const handleTimeSelectChange = (selectedOption) => {
    setLocalTime(moment.duration(selectedOption.value).asMinutes()); // Updates localTime based on selected option
    handleTimeChange(zone, moment.duration(selectedOption.value).asMinutes()); // Updates the global time for the zone
  };

  // Effect to synchronize localTime with the provided time
  useEffect(() => {
    setLocalTime(moment.duration(time, "HH:mm").asMinutes()); // Sets localTime whenever the time prop changes
  }, [time]);

  // Function to format and display time for a specific timezone
  const formatDisplayTime = (zone, minutes) => {
    const updatedDateTime = moment(selectedDate)
      .startOf("day")
      .add(minutes, "minutes")
      .format("YYYY-MM-DD HH:mm");
    return moment.tz(updatedDateTime, timezones[zone]).format("h:mm A"); // Formats time in 12-hour format
  };

  // Function to format and display date for a specific timezone
  const formatDisplayDate = (zone, minutes) => {
    const updatedDateTime = moment(selectedDate)
      .startOf("day")
      .add(minutes, "minutes")
      .format("YYYY-MM-DD HH:mm");
    return moment.tz(updatedDateTime, timezones[zone]).format("ddd D, MMMM"); // Formats date to display day and month
  };

  // Labels for the time slider
  const labels = ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];

  return (
    <div
      className={"zone-box"} // CSS class for styling the container
      id={isDark && "dark-zone-box"} // Conditional ID for dark mode styling
      ref={setNodeRef} // Ref for drag-and-drop functionality
      style={style} // Applies the drag-and-drop style
    >
      <div className="zone-top-row">
        <div className="drag-button" {...listeners} {...attributes}>
          {/* Draggable handle */}
          <RiDraggable />
          <RiDraggable />
          <RiDraggable />
          <RiDraggable />
        </div>
        <div className="zone-left-box">
          <h1 style={isDark ? { color: "white" } : {}}>
            {getTimezoneAbbr(timezones[zone])} {/* Displays the timezone abbreviation */}
          </h1>
          <p>{zone.replace(/-/g, "/")}</p> {/* Displays the full timezone name */}
        </div>
        <div className="zone-right-box">
          <Select
            className={"time-picker"} // CSS class for styling the select component
            classNamePrefix="select" // Prefix for class names in the select component
            placeholder={formatDisplayTime(zone, localTime)} // Sets the initial displayed time
            value={timeOptions.find(
              (option) =>
                moment.duration(option.value).asMinutes() === localTime
            )} // Matches the selected time option with localTime
            options={timeOptions} // List of time options for selection
            onChange={handleTimeSelectChange} // Calls handler on time selection change
            styles={{
              indicatorsContainer: () => ({ display: "none" }), // Hides dropdown indicators
              container: (prev) => ({
                ...prev,
                width: "15vw",
                height: "8vh",
              }), // Styles for the select container
              placeholder: (prev) => ({
                ...prev,
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: isDark ? "white" : "black",
              }), // Styles for the placeholder
              valueContainer: (prev) => ({
                ...prev,
                fontSize: "1.5rem",
                fontWeight: "bold",
                borderRadius: "0.5vh",
                color: isDark ? "white" : "black",
                backgroundColor: isDark ? "#2c2f34ef" : "white",
              }), // Styles for the value container
            }}
          />
          <span>
            <span>{getTimezoneOffset(zone)}</span> {/* Displays the timezone offset */}
            <span>{formatDisplayDate(zone, localTime)}</span> {/* Displays the formatted date */}
          </span>
        </div>
        <button className="remove" onClick={() => removeTimezone(zone)}>
          x {/* Button to remove the timezone */}
        </button>
      </div>
      <Slider
        className="time-slider" // CSS class for styling the slider
        thumbClassName="time-thumb" // CSS class for the slider thumb
        trackClassName={
          isDark
            ? "horizontal-time-track dark-horizontal-time-track"
            : "horizontal-time-track"
        } // CSS class for the slider track, conditional on dark mode
        markClassName="vertical-time-mark" // CSS class for slider marks
        marks={generateSliderMarks()} // Marks to display on the slider
        min={0} // Minimum value for the slider
        max={1440} // Maximum value for the slider (24 hours in minutes)
        step={15} // Slider steps in minutes
        value={localTime} // Current value of the slider
        onChange={handleSliderChange} // Handler for slider changes
        onAfterChange={handleSliderChangeComplete} // Handler after slider change is complete
        renderThumb={(props, state) => <div {...props}>||</div>} // Custom thumb rendering
        renderMark={(props) => <span {...props} />} // Custom mark rendering
      />
      {labels && (
        <div className="labels">
          {generateSliderMarks()
            .filter((mark, index) => mark % 180 === 0) // Filters marks to show only specific labels
            .map((mark, index) => (
              <div key={mark}>{labels[index]}</div> // Displays the labels
            ))}
        </div>
      )}
    </div>
  );
};






  return (
<div className="parent-container" id={isDark && "dark-parent-container"}>
    {/* Main container with conditional dark mode class */}
    
    <h1 style={{ margin: "3vh 0", color: "#033f9e" }}>
        Playpower Labs Time-Zone Converter
    </h1>
    {/* Header title for the timezone converter */}

    <div className="top-row" id={isDark && "dark-top-row"}>
        {/* Top row containing the timezone selector and controls, with dark mode class if applicable */}

        <Select
            className="basic-single"
            classNamePrefix="select"
            placeholder={"Add Time Zone, City or Town"}
            isSearchable={true} // Allows searching in the dropdown
            name="timezone"
            options={allTimezones} // Options for all available timezones
            onChange={addNewTimezone} // Adds a new timezone on selection
            styles={{
                container: (prev) => ({
                    ...prev,
                    width: "30vw", // Width of the select container
                    height: "5vh", // Height of the select container
                }),
                valueContainer: (prev) => ({
                    ...prev,
                    width: "30vw", // Width of the value container
                    height: "6vh", // Height of the value container
                    borderRadius: "0.5vh 0 0 0.5vh", // Rounded corners for the left side
                    backgroundColor: isDark ? "#2c2f34ef" : "white", // Background color based on dark mode
                }),
                indicatorsContainer: (prev) => ({
                    ...prev,
                    borderRadius: "0 0.5vh 0.5vh 0", // Rounded corners for the right side
                    backgroundColor: isDark ? "#2c2f34ef" : "white", // Background color based on dark mode
                }),
            }}
        />
        {/* Select component for adding new timezones */}

        <div className="date-body">
            <DatePicker
                className={isDark ? "date-picker dark-date-picker" : "date-picker"}
                id="date-picker"
                selected={selectedDate} // Currently selected date
                onChange={handleDateChange} // Updates the selected date
                dateFormat="MMMM d, yyyy" // Date format for display
            />
            {/* Date picker component for selecting dates */}

            <label
                className="calendar-box"
                htmlFor="date-picker"
                style={
                    isDark
                        ? { backgroundColor: "#2c2f34ef", borderRadius: "0 1vh 1vh 0" }
                        : {}
                }
            >
                <FaCalendarAlt color="#0098ca" />
            </label>
            {/* Label with calendar icon for the date picker */}
        </div>

        <div className="filter-box">
            {/* Container for control icons */}

            <div onClick={handleBookGoogleMeet}>
                <FaCalendarMinus color="#0098ca" />
            </div>
            {/* Icon to open Google Meet scheduler */}

            <div onClick={reverseTimezones}>
                <BiSortAlt2 color="#0098ca" />
            </div>
            {/* Icon to reverse the order of timezones */}

            <div onClick={() => setIsSharing(!isSharing)}>
                <FaLink color="#0098ca" />
            </div>
            {/* Icon to toggle sharing mode */}

            <div onClick={() => setIsDark((prev) => !prev)}>
                {isDark ? (
                    <MdLightMode color="#0098ca" />
                ) : (
                    <MdDarkMode color="#0098ca" />
                )}
            </div>
            {/* Icon to toggle dark mode */}
        </div>
    </div>

    <DndContext collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        {/* Drag-and-drop context for sorting timezones */}
        
        <div className="time-converter">
            <SortableContext
                items={timezoneEntries.map(([zone]) => zone)} // List of items to be sorted
                strategy={verticalListSortingStrategy} // Sorting strategy
            >
                {timezoneEntries.map(([zone, time]) => (
                    <SubContainer key={zone} zone={zone} time={time} />
                ))}
                {/* Maps timezone entries to SubContainer components */}
            </SortableContext>
        </div>
    </DndContext>
</div>
  );
};

export default MultiTimeZoneConverter;
