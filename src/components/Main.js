import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { PDFDocument, rgb } from "pdf-lib";

import classes from "./Main.module.css";
import logo from "../assets/NewAnimation.gif";

import CloseIcon from "@mui/icons-material/Close";

function Main() {
  const [data, setData] = useState(null);
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [populationColumn, setPopulationColumn] = useState("");
  const [samplesize, setSamplesize] = useState("");
  const [finalArray, setFinalArray] = useState([]);
  const [samplingInterval, setSamplingInterval] = useState("");
  const [expectedSamples, setExpectedSamples] = useState("");
  const [popup, setPopup] = useState(false);
  const [deviation, setDeviation] = useState(null);
  const [workBook, setWorkBook] = useState(null);
  const [fileName, setFileName] = useState("");
  const [reportDownload, setReportDownload] = useState(false);
  const [samplingIntervalForPTag, setSamplingIntervalForPTag] = useState("");
  // const fileInputRef = useRef(null);

  useEffect(() => {
    // console.log(data);
  }, [data]);

  function twoDigitRoundAndAddingCommas(number) {
    return (Math.ceil(number*100)/100).toLocaleString()
    
  }

  // useEffect(() => {
  //   // Check if a file is already selected in the input field
  //   if (fileInputRef.current && fileInputRef.current.files.length > 0) {
  //     // Refresh the page to reset the input field
  //     window.location.reload();
  //     fileInputRef.current.click();
  //   }
  // }, []);

  const runDhruvMUS1 = async (identifier, amounts, samplingInterval) => {
    console.log("sampling interval = ", samplingInterval);
    try {
      const randomNumber = generateRandomNumber(samplingInterval);
      console.log('identifier',identifier);
      console.log('sampling interval',samplingInterval);
      console.log('amounts',amounts);

      // identifier.shift();
      // amounts.shift();
      // console.log('shifted amounts', amounts);
      const mus1Result = DhruvMUS1(
        identifier,
        samplingInterval,
        amounts,
        randomNumber
      );
      console.log("Random Number:", randomNumber);
      console.log("DhruvMUS1 Result:", mus1Result);

      //create excel workbook

      createExcelWorkbook(randomNumber, mus1Result, amounts);
      // const pdfBytes = await createPdfWorkbook(
      //   randomNumber,
      //   mus1Result,
      //   amounts
      // );

      // // Convert the PDF bytes to a Blob
      // const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

      // // Create a URL for the PDF Blob and create an anchor element to trigger the download
      // const url = URL.createObjectURL(pdfBlob);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = "sampling_results.pdf";

      // // Trigger the download by clicking the anchor element
      // a.click();

      // // Cleanup: Revoke the URL to free resources
      // URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    }
  };

  const createExcelWorkbook = (randomNumber, mus1Result, amounts) => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create Sheet 1
    const sheet1Data = [
      // [
      //   "First, we take \n a random number between 0 and sampling interval. Once the random number is selected, we\n loop through the amount column and keep subtracting the value from the random number. If that number is less than 0, we select that sample and add sampling interval to that value.This process is repeated till we loop through all the values in the file."
        
      // ],
      [
        { v: "First, we take a random number between 0 and sampling interval.\nOnce the random number is selected, we loop through the amount column and\nkeep subtracting the value from the random number.\nIf that number is less than 0, we select that sample and add sampling interval to that value.\nThis process is repeated till we loop through all the values in the file.", t: "s", s: { alignment: { wrapText: true } } },
      ],
      [
        "Date and time when the request was processed",
        new Date().toLocaleString(),
      ],
      ["User Input: File", fileName],
      ["User Input: Unique Identifier Column Name", uniqueIdentifier],
      ["User Input: Value/Amount Column Name", populationColumn],
      ["User Input: Number of Samples", twoDigitRoundAndAddingCommas(samplesize)],
      ["User Input: Sampling Interval", twoDigitRoundAndAddingCommas(samplingInterval)],
      [
        "Total value of the population",
        twoDigitRoundAndAddingCommas(amounts.reduce((accumulator, currentValue) => {
          const numericValue = Number(currentValue);
          if (!isNaN(numericValue)) {
            return accumulator + numericValue;
          }
          return accumulator;
        }, 0)),
      ],
      ["Number of Samples Selected by the utility", twoDigitRoundAndAddingCommas(mus1Result.length)],
      [
        "Deviation between user provided number of samples and the number of samples selected by the utility (in percentage)",
        `${twoDigitRoundAndAddingCommas(((mus1Result.length - samplesize) / samplesize) * 100)}%`,
      ],
      ["Initial Random Number Generated i.e. Starting Point", twoDigitRoundAndAddingCommas(randomNumber)],
    ];

    
    setDeviation(() => {
      return ((mus1Result.length - samplesize) / samplesize) * 100;
    });

    // console.log('sum',amounts.reduce((accumulator, currentValue) => {
    //   const numericValue = Number(currentValue);
    //   if (!isNaN(numericValue)) {
    //     return accumulator + numericValue;
    //   }
    //   return accumulator;
    // }, 0));

    const sheet1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    sheet1["A1"].s = {
      alignment: { wrapText: true }
    }

    XLSX.utils.book_append_sheet(workbook, sheet1, "User Input");

    // Create Sheet 2 (Duplicate of original dataset)
    const sheet2Data = [
      Object.keys(data[0]), // Adding column headers as the first row
      ...data.map((row) => Object.values(row)),
    ];

    const sheet2 = XLSX.utils.aoa_to_sheet(sheet2Data);
    XLSX.utils.book_append_sheet(workbook, sheet2, "Input File");

    // Create Sheet 3 (Samples selected)
    // const sheet3Data = [['Unique Identifier', 'Sampled Values']];

    // console.log(mus1Result);
    // mus1Result.forEach((sampledValue) => {
    //   console.log(sampledValue);
    //   const identifier = data.find((row) => Object.values(row).includes(sampledValue));
    //   if (identifier) {
    //     // console.log(identifier);
    //     const value = Object.values(identifier)[1];
    //     // console.log([sampledValue,value])
    //     sheet3Data.push([sampledValue,value]);
    //   }
    // });

    const sheet3Data = [Object.keys(data[0])]; // Adding column headers as the first row

    mus1Result.forEach((sampledValue) => {
      const rowsWithSample = data.filter((row) =>
        Object.values(row).includes(sampledValue)
      );
      rowsWithSample.forEach((row) => {
        sheet3Data.push(Object.values(row));
      });
    });

    // console.log(sheet3Data);
    // console.log(data[0])
    const sheet3 = XLSX.utils.aoa_to_sheet(sheet3Data);
    XLSX.utils.book_append_sheet(workbook, sheet3, "Samples");

    if (
      ((mus1Result.length - samplesize) / samplesize) * 100 > 10 ||
      ((mus1Result.length - samplesize) / samplesize) * 100 < -10
    ) {
      setPopup((prevState) => {
        return !prevState;
      });
      setWorkBook(workbook);
      return workbook;
    } else {
      // Save the workbook as an Excel file
      XLSX.writeFile(workbook, "sampling_results.xlsx");
    }
    return workbook;
  };

  const createPdfWorkbook = async (randomNumber, mus1Result, amounts) => {
    console.log("createpdf1");
    const pdfDoc = await PDFDocument.create();
    console.log("createpdf12");
    // Add an initial empty page to the PDF
    pdfDoc.addPage();
    console.log("createpdf3");
    let { width, height } = pdfDoc.getPage(0).getSize();
    width+=height*3
    height+=width*4
    console.log("createpdf4");
    const fontSize = 12;
    console.log("createpdf5");
    const textX = 50;
    console.log("createpdf6");
    let textY = height - 50;
    console.log("createpdf7");

    // Create three pages in the PDF
    for (let i = 0; i < 3; i++) {
      console.log("createpdf8");
      const page = pdfDoc.addPage([width, height]);
      console.log("createpdf9");
      // Add content to each page
      page.drawText("Sampling Results - Page " + (i + 1), {
        x: textX,
        y: textY,
        size: fontSize,
      });
      console.log("createpdf10");
      textY -= 30;
      console.log("createpdf11");

      // Convert data to a 2D array for the table-like structure
      const tableData = [
        Object.keys(data[0]), // Column headers
        ...data.map((row) => Object.values(row)),
      ];
      console.log("createpdf12");
      // Draw the table-like structure using drawText method
      const padding = 5;
      console.log("createpdf13");
      const cellWidth = (width - 2 * textX) / tableData[0].length;
      console.log("createpdf14");
      for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
        const row = tableData[rowIndex];
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const cellText = row[colIndex].toString();
          const cellX = textX + colIndex * cellWidth;
          const cellY = textY - rowIndex * (fontSize + padding);
          page.drawText(cellText, { x: cellX, y: cellY, size: fontSize });
        }
      }
      console.log("createpdf15");
      // Move to the next page
      textY = height - 50;
      console.log("createpdf16");
    }
    console.log("createpdf17");
    // Save the PDF as a Uint8Array
    const pdfBytes = await pdfDoc.save();
    console.log("createpdf18");
    return pdfBytes;
  };

  const popupHandler = () => {
    setPopup((prevState) => {
      return !prevState;
    });
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
  const calculateExpectedSamples = (interval, populationArray) => {
    // console.log("Importanttt", interval, populationArray.length);
    if (interval && populationArray.length > 0) {
      // const sumOfValues = finalArray.reduce((acc, value) => acc + value, 0);
      const sumOfValues = populationArray.reduce(
        (accumulator, currentValue) => {
          const numericValue = Number(currentValue);
          if (!isNaN(numericValue)) {
            return accumulator + numericValue;
          }
          return accumulator;
        },
        0
      );
      console.log(sumOfValues, 'sumof valus in calculate expected samples funciton');
      const expectedamountofSamples = Math.ceil(sumOfValues / interval);
      console.log("Read this important", sumOfValues, expectedamountofSamples);
      setExpectedSamples(() => {
        return expectedamountofSamples;
      });
      console.log(expectedSamples, 'expected samples state valiable ki value');
    }
  };

  const handleChecking = () => {
    if (!data || !populationColumn || !uniqueIdentifier) {
      alert("Please select valid unique identifier and population column.");
      return;
    }

    const uniqueIdentifiers = data.map((row) => row[uniqueIdentifier]);
    const populationArray = data.map((row) => row[populationColumn]);

    if (uniqueIdentifiers.length !== new Set(uniqueIdentifiers).size) {
      alert("Identifier Column must have all unique values.");
      return;
    }

    if (uniqueIdentifiers.length !== populationArray.length) {
      alert("Identifier and population column must be of the same length.");
      return;
    }

    if (isNaN(samplingInterval) || samplingInterval <= 0) {
      alert("Sampling Interval must be a positive number.");
      return;
    }

    if (isNaN(samplesize) || samplesize <= 0) {
      alert("Number of Samples must be a positive integer.");
      return;
    }

    for (let i = 0; i < populationArray.length; i++) {
      // console.log(populationArray[i]);
      if (Number.isNaN(Number(populationArray[i]))) {
        alert(`Value/Amount column must contain numbers only`);
        return;
      }
      if (populationArray[i] == "" || populationArray[i] == null) {
        alert(`Value/Amount column must not be empty or null`);
        return;
      }
    }

    // console.log(populationArray[2])
    setFinalArray(populationArray);

    // Run DhruvMUS1 function here with the selected arrays and sampling interval
    if (uniqueIdentifiers.length > 0 && populationArray.length > 0) {
      calculateExpectedSamples(samplingInterval, populationArray);
      // runDhruvMUS1(uniqueIdentifiers, populationArray, samplingInterval);
    }

    const sumOfValues = populationArray.reduce((accumulator, currentValue) => {
      const numericValue = Number(currentValue);
      if (!isNaN(numericValue)) {
        return accumulator + numericValue;
      }
      return accumulator;
    }, 0);

    if (Number(samplingInterval) > sumOfValues) {
      alert(`Sampling Interval cannot be greater than Population value`);
      return;
    }

    if (Number(samplesize) > populationArray.length) {
      alert(`Number of samples cannot be greater than number of rows`);
      return;
    }

    setSamplingIntervalForPTag(samplingInterval);

    setReportDownload(() => {
      return true;
    });

    console.log(sumOfValues, 'sum of values after confirm button push');
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
      alert("Identifier and population column must be of the same length.");
      return;
    }

    if (isNaN(samplingInterval) || samplingInterval <= 0) {
      alert("Sampling Interval must be a positive number.");
      return;
    }

    setFinalArray(populationArray);

    console.log(populationArray[0], 'population array ka first element');
    // Run DhruvMUS1 function here with the selected arrays and sampling interval
    if (uniqueIdentifiers.length > 0 && populationArray.length > 0) {
      calculateExpectedSamples(samplingInterval, populationArray);
      runDhruvMUS1(uniqueIdentifiers, populationArray, samplingInterval);
    }
  };

  const handleUniqueIdentifierChange = (e) => {
    setUniqueIdentifier(e.target.value);
  };

  const handlePopulationColumnChange = (e) => {
    setPopulationColumn(e.target.value);
  };

  const handleSamplesizeChange = (e) => {
    setSamplesize(e.target.value);
  };

  const handleSamplingIntervalChange = (e) => {
    // console.log(e.target.value);
    setSamplingInterval(() => {
      return Number(e.target.value);
    });
    // console.log(samplingInterval);
    // calculateExpectedSamples(Number(e.target.value));
    // console.log(expectedSamples);
  };

  const handleFileChange = async (e) => {
    // if (e.target.files.length > 1) {
    // Reset the file input value to null to allow the user to select a new file
    // fileInputRef.current.value = null;
    // console.log(e.target.files.length, 'lhs');
    // window.location.reload()
    // }

    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      if (file.type === "text/csv") {
        // Handle CSV file
        Papa.parse(file, {
          complete: (result) => {
            const csvData = result.data;
            // console.log(csvData);
            // console.log(csvData[csvData.length - 1]);
            // console.log(csvData[csvData.length - 1][0]);
            setData(csvData);
            // console.log(csvData);
          },
          header: true,
          skipEmptyLines: true,
        });
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        // Handle XLSX file
        const reader = new FileReader();
        reader.onload = async (event) => {
          const result = event.target.result;
          const workbook = XLSX.read(result, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(
            workbook.Sheets[firstSheetName],
            { header: 0, defval: '' }
          );
          console.log(sheetData, 'sheetdata')
          const modifiedData = await modifyDataArrays(sheetData);
          // console.log('Harsh',modifiedData);
          setData(modifiedData);
          // console.log(modifiedData)
        };
        reader.readAsBinaryString(file);
      } else {
        // console.error("Unsupported file format");
        alert("Unsupported file format");
      }
    }
  };
  const modifyDataArrays = (data) => {
    if (!data || !populationColumn) return data;
    console.log(data);

    const populationArray = data.map((row) => row[populationColumn]);
    const splicedArrays = spliceArraysByUniqueIdentifier(data, populationArray);
    const trimmedArrays = splicedArrays.map((arr) => arr.slice(1));

    return data.map((row, rowIndex) => {
      return {
        ...row,
        [populationColumn]: trimmedArrays[rowIndex],
      };
    });
  };
  const spliceArraysByUniqueIdentifier = (data, values) => {
    const uniqueIdsSet = new Set(values);
    const splicedArrays = [];
    uniqueIdsSet.forEach((id) => {
      const index = values.indexOf(id);
      const row = data[index];
      splicedArrays.push(row.slice(1));
    });
    return splicedArrays;
  };
  const reportDownloadHandler = () => {
    // Convert the workbook to a blob
    const wbout = XLSX.write(workBook, { type: "array", bookType: "xlsx" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    // Create a URL for the blob and create an anchor element to trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sampling_results.xlsx";

    // Trigger the download by clicking the anchor element
    a.click();

    // Cleanup: Revoke the URL to free resources
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {popup && (
        <div className={classes.popup}>
          <CloseIcon
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              fontSize: "30px",
              cursor: "pointer",
            }}
            onClick={popupHandler}
          />
          <p>Note:- Deviation crossed the 10% threshold</p>
          <br />
          <p>Deviation:- {Math.floor(deviation * 100) / 100}%</p>

          <button onClick={reportDownloadHandler}>Download Report</button>
        </div>
      )}
      <main className={classes.main}>
        <div>
          <span>
            <input
              type="file"
              name="data"
              id="data"
              accept=".csv, .xlsx"
              onChange={handleFileChange}
              // ref={fileInputRef}
            />
          </span>
          {/* <button>Proceed</button> */}
        </div>
        {/* <section>
        <img height='100px' width='100px' src={logo} alt="" />
        <p>Wait till your data is being preocessed</p>
      </section> */}
        {data && (
          <>
            <span className={classes.first}>
              <select
                name=""
                id=""
                value={uniqueIdentifier}
                onChange={handleUniqueIdentifierChange}
              >
                <option value="">Select Unique Identifier Column</option>
                {Object.keys(data[0]).map((column, index) => (
                  <option key={index} value={column}>
                    {" "}
                    {column}{" "}
                  </option>
                ))}
              </select>
              <select
                name=""
                id=""
                value={populationColumn}
                onChange={handlePopulationColumnChange}
              >
                <option value="">Select Value/Amount Column</option>
                {Object.keys(data[0]).map((column, index) => (
                  <option key={index} value={column}>
                    {column}
                  </option>
                ))}
              </select>
              <input
                onChange={handleSamplesizeChange}
                type="number"
                placeholder="No. of Samples"
                name=""
                id=""
                min="0"
              />
            </span>
            <span className={classes.second}>
              <input
                type="number"
                placeholder="Sampling Interval"
                name=""
                id=""
                min="0"
                value={samplingInterval}
                onChange={handleSamplingIntervalChange}
              />
              <button onClick={handleChecking}>Confirm Input</button>
              {reportDownload && (
                <button onClick={handleFinalizeArray}>Report Download</button>
              )}
            </span>
            {expectedSamples && (
              <p className={classes.smallp}>
                Total Population value is{" "}
                {(Math.ceil(finalArray.reduce((accumulator, currentValue) => {
                  const numericValue = Number(currentValue);
                  if (!isNaN(numericValue)) {
                    return accumulator + numericValue;
                  }
                  return accumulator;
                }, 0)*100)/100).toLocaleString()}
                , expected number of samples is {expectedSamples.toLocaleString()} based on
                sampling interval {samplingIntervalForPTag.toLocaleString()}.
              </p>
            )}
          </>
        )}

        {data && (
          <table className={classes.table}>
            {/* <tbody> */}
            <tr>
              {Object.keys(data[0]).map((column, index) => (
                <th key={index}>{column}</th>
              ))}
              {/* <th>Column 1</th>
          <th>Column 2</th>
          <th>Column 3</th>
          <th>Column 4</th>
          <th>Column 5</th>
          <th>Column 6</th>
          <th>Column 7</th>
          <th>Column 8</th>
          <th>Column 9</th>
          <th>Column 10</th>
          <th>Column 11</th>
          <th>Column 12</th>
          <th>Column 13</th>
          <th>Column 14</th>
          <th>Column 15</th>
          <th>Column 16</th>
          <th>Column 17</th>
          <th>Column 18</th>
          <th>Column 19</th>
          <th>Column 20</th>*/}
            </tr>
            {data.slice(0, 10).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}

            {/* <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>

        </tr>
        <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>

        </tr>
        <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>

        </tr>
        <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>

        </tr>
        <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>

        </tr>
        <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>

        </tr>
        <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>

        </tr>
        <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>

        </tr>
        <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>

        </tr>
        <tr>
          <td>Value 1</td>
          <td>Value 2</td>
          <td>Value 3</td>
          <td>Value 4</td>
          <td>Value 5</td>
          <td>Value 6</td>
          <td>Value 7</td>
          <td>Value 8</td>
          <td>Value 9</td>
          <td>Value 10</td>
          <td>Value 11</td>
          <td>Value 12</td>
          <td>Value 13</td>
          <td>Value 14</td>
          <td>Value 15</td>
          <td>Value 16</td>
          <td>Value 17</td>
          <td>Value 18</td>
          <td>Value 19</td>
          <td>Value 20</td>
        </tr>   */}
            {/* </tbody> */}
          </table>
        )}
        {/* {data && <div>hello</div>} */}
      </main>
    </>
  );
}

export default Main;
