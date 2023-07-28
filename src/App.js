import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

import "./App.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Main from "./components/Main";

function App() {
  const [data, setData] = useState(null);
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [populationColumn, setPopulationColumn] = useState("");
  const [finalArray, setFinalArray] = useState([]);
  const [samplingInterval, setSamplingInterval] = useState("");
  const [expectedSamples, setExpectedSamples] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "text/csv") {
        // Handle CSV file
        Papa.parse(file, {
          complete: (result) => {
            const csvData = result.data;
            setData(csvData);
          },
          header: true,
        });
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        // Handle XLSX file
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target.result;
          const workbook = XLSX.read(result, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(
            workbook.Sheets[firstSheetName],
            { header: 1 }
          );
          setData(sheetData);
        };
        reader.readAsBinaryString(file);
      } else {
        console.error("Unsupported file format");
      }
    }
  };

  const handleUniqueIdentifierChange = (e) => {
    setUniqueIdentifier(e.target.value);
  };

  const handlePopulationColumnChange = (e) => {
    setPopulationColumn(e.target.value);
  };

  const handleSamplingIntervalChange = (e) => {
    setSamplingInterval(Number(e.target.value));
    calculateExpectedSamples(Number(e.target.value));
  };

  const handleFinalizeArray = () => {
    if (!data || !populationColumn || !uniqueIdentifier) {
      alert("Please select valid unique identifier and population column.");
      return;
    }

    const uniqueIdentifiers = data.map((row) => row[uniqueIdentifier]);
    const populationArray = data.map((row) => row[populationColumn]);

    if (uniqueIdentifiers.length !== new Set(uniqueIdentifiers).size) {
      alert("Identifier must have all unique values.");
      return;
    }

    if (uniqueIdentifiers.length !== populationArray.length) {
      alert("Identifier and population column must be the same length.");
      return;
    }

    if (isNaN(samplingInterval) || samplingInterval <= 0) {
      alert("Sampling Interval must be a positive number.");
      return;
    }

    setFinalArray(populationArray);

    // Run DhruvMUS1 function here with the selected arrays and sampling interval
    if (uniqueIdentifiers.length > 0 && populationArray.length > 0) {
      runDhruvMUS1(uniqueIdentifiers, populationArray, samplingInterval);
    }
  };

  const runDhruvMUS1 = (identifier, amounts, samplingInterval) => {
    try {
      const randomNumber = generateRandomNumber(samplingInterval);
      console.log(identifier);
      console.log(samplingInterval);
      console.log(amounts);

      identifier.shift()
      amounts.shift()
      const mus1Result = DhruvMUS1(
        identifier,
        samplingInterval,
        amounts,
        randomNumber
      );
      console.log("Random Number:", randomNumber);
      console.log("DhruvMUS1 Result:", mus1Result);
    } catch (error) {
      alert(error.message);
    }
  };

  const calculateExpectedSamples = (interval) => {
    if (interval && finalArray.length > 0) {
      const sumOfValues = finalArray.reduce((acc, value) => acc + value, 0);
      const expectedSamples = Math.ceil(sumOfValues / interval);
      setExpectedSamples(expectedSamples);
    }
  };

  function generateRandomNumber(samplingInterval) {
    return Math.floor(Math.random() * samplingInterval);
  }

  function DhruvMUS1(identifier, samplingInterval, amounts, randomNumber) {
    let arrayFromSetIdentifier = new Set(identifier);
    arrayFromSetIdentifier = Array.from(arrayFromSetIdentifier);

    if (identifier.length !== arrayFromSetIdentifier.length) {
      throw Error("Identifier must have all unique values.");
    }
    if (identifier.length !== amounts.length) {
      throw Error("Identifier has to be the same length as amounts.");
    }
    if (samplingInterval <= 0) {
      throw Error("Sampling Interval must be greater than zero.");
    }

    let cumsum = randomNumber;
    let SelectedIdentifiers = new Set();

    for (let index in amounts) {
      let value = amounts[index];
      cumsum -= value;
      while (cumsum <= 0) {
        cumsum += samplingInterval;
        SelectedIdentifiers.add(identifier[index]);
      }
    }
    SelectedIdentifiers = Array.from(SelectedIdentifiers);
    return SelectedIdentifiers;
  }

  return (
    // <div>
    //   <input type="file" accept=".csv, .xlsx" onChange={handleFileChange} />
    //   {data && (
    //     <div>
    //       <label>
    //         Select Unique Identifier:
    //         <select
    //           value={uniqueIdentifier}
    //           onChange={handleUniqueIdentifierChange}
    //         >
    //           <option value="">-- Select --</option>
    //           {Object.keys(data[0]).map((column, index) => (
    //             <option key={index} value={column}>
    //               {column}
    //             </option>
    //           ))}
    //         </select>
    //       </label>

    //       <label>
    //         Select Population Column:
    //         <select
    //           value={populationColumn}
    //           onChange={handlePopulationColumnChange}
    //         >
    //           <option value="">-- Select --</option>
    //           {Object.keys(data[0]).map((column, index) => (
    //             <option key={index} value={column}>
    //               {column}
    //             </option>
    //           ))}
    //         </select>
    //       </label>

    //       <button onClick={handleFinalizeArray}>Finalize Array</button>

    //       {finalArray.length > 0 && (
    //         <div>
    //           <h3>Final Numeric Array:</h3>
    //           <ul>
    //             {finalArray.map((value, index) => (
    //               <li key={index}>{value}</li>
    //             ))}
    //           </ul>
    //         </div>
    //       )}

    //       <label>
    //         Sampling Interval (Numeric Input):
    //         <input
    //           type="number"
    //           value={samplingInterval}
    //           onChange={handleSamplingIntervalChange}
    //         />
    //       </label>

    //       {expectedSamples !== "" && (
    //         <div>
    //           <h3>Expected Number of Samples:</h3>
    //           <p>{expectedSamples}</p>
    //         </div>
    //       )}
    //     </div>
    //   )}
    // </div>

    <>
      <Header/>
      <div className="main">
        <Sidebar/>
        <Main/>
      </div>
    </>
  );
}

export default App;
