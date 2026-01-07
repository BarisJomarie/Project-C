const customStyles = {
  container: (provided, state) => ({
    ...provided,
    width: '100%',
    fontFamily: 'Roboto Condensed, sans-serif',
    borderRadius: '5px',
    margin: state.selectProps.id === 'co-author' && '5px 0' 
  }),
  placeholder: (provided) => ({
    ...provided,
    paddingLeft: '5px',
    fontSize: '1em'
  }),
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "white",
    paddingLeft: '5px',
    color: "white",
    borderColor: state.isFocused ? "#C83F12" : "#ccc",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(200, 63, 18, 0.1)" : "none",
    "&:hover": {
      borderColor: state.isFocused ? '#C83F12' : "#475569",
    },
    ":active": {
      borderColor: '#C83F12',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#C83F12"
      : state.isFocused
      ? "#fff38781"
      : "white",
    color: state.isSelected ? "white" : state.isFocused ? "black" : "black",
    cursor: "pointer",
    ":active": {
      backgroundColor: "#2A0407",
      color: "white",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "black",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#C83F12",
    borderRadius: "4px",
    padding: "2px 6px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#ffffff",
    fontWeight: "200",
    fontSize: "1rem",
    padding: "0 10px",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#ffffff",
    ":hover": {
      backgroundColor: "#ffffff",
      color: "#C83F12",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 10,
  })
};

export default customStyles;
