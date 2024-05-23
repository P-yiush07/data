import React, { useState } from 'react';
import axios from 'axios';
import DataTable from './DataTable';

const fetchDescribe = async () => {

  const response = await axios.get('http://127.0.0.1:5000/describe');

  return response.data;

}

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState({});
  const [head, setHead] = useState([]);
  const [columnTitles, setColumnTitles] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showLinearRegressionForm, setShowLinearRegressionForm] = useState(false);
  const [mse, setMSE] = useState(null); // State to store MSE value
  const [data, setData] = useState(null);


  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.log('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    axios.post('http://localhost:5000/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then((response) => {
        let responseData = response.data;
        if (typeof responseData === 'string') {
          responseData = responseData.replace(/NaN/g, 'null');
          responseData = JSON.parse(responseData);
        } else if (typeof responseData !== 'object') {
          console.log('Unexpected response format:', responseData);
          // Handle the error or unexpected format
          return;
        }

        setFileData(responseData);
        setHead([]); // Clear the previous head data

        // Extract column titles and set them as columnTitles
        if (responseData.head && responseData.head.length > 0) {
          const titles = Object.keys(responseData.head[0]);
          setColumnTitles(titles);
        }

        // Logging the head contents
        console.log(responseData.head);
      })
      .catch((error) => {
        // handle errors
        console.log(error);
      });
  }

  const handleHead = () => {
    if (fileData.head && fileData.head.length > 0) {
      setHead(fileData.head);
      console.log('Transformed head data:', fileData.head);
    }
  };

  const handleTail = () => {
    axios.get('http://127.0.0.1:5000/tail')
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  const handleColumnChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedColumns([...selectedColumns, value]);
    } else {
      setSelectedColumns(selectedColumns.filter(column => column !== value));
    }
  };

  const handleSubmit = () => {
    if (selectedColumns.length < 2) {
      console.log('Please select at least two columns');
      return;
    }

    // Make a POST request to send selected columns to the server
    axios.post('http://127.0.0.1:5000/plot', {
      column1: selectedColumns[0],
      column2: selectedColumns[1] // Assuming we are plotting histograms for the first two selected columns
    })
      .then((response) => {
        console.log('Histogram plotted successfully', response);

      })
      .catch((error) => {
        console.log('Error plotting histogram:', error);

      });

    console.log('Selected Columns:', selectedColumns);
  };

  const handleLinearRegression = () => {
    setShowLinearRegressionForm(true);
  };

  const handleLinearRegressionSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    // Make a POST request to perform linear regression
    axios.post('http://127.0.0.1:5000/train', {
      selected_columns: selectedColumns
    })
      .then((response) => {
        const { mse } = response.data;
        setMSE(mse);
        console.log('Linear regression results:', response);
      })
      .catch((error) => {
        console.log('Error performing linear regression:', error);
      });
  };

  const handleGetInfo = async () => {
    try {
      const res = await fetchDescribe();
      setData(res.data);
    } catch (error) {
      console.log(error);
    }
  }

  if (data !== null) {
    console.log(data);
  }

  const handleNull = (category) => {

    console.log(category);

    // Construct data object with selected_columns as an array containing the category
    const data = {
      selected_columns: [category]  // Pass category as an array element
    };

    axios.post('http://127.0.0.1:5000/fillna', data)
      .then((response) => {
        console.log('Null values filled successfully', response);
      })
      .catch((error) => {
        console.log('Error filling null values:', error);
      });
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <button onClick={handleHead}>Head</button>
      <button onClick={handleTail}>Tail</button>
      <button onClick={handleGetInfo}>Get Info</button>

      {/* Render checkboxes for column titles */}
      {columnTitles.length > 0 && !showLinearRegressionForm && (
        <form>
          <h2>Select Columns</h2>
          {columnTitles.map((title, index) => (
            <div key={index}>
              <label>
                <input
                  type="checkbox"
                  value={title}
                  onChange={handleColumnChange}
                />
                {title}
              </label>
            </div>
          ))}
          <button type="button" onClick={handleSubmit} disabled={selectedColumns.length < 2}>
            Submit
          </button>
          <button type="button" onClick={handleLinearRegression}>
            Calculate Linear Regression
          </button>
        </form>
      )}

      {/* Show linear regression form if enabled */}
      {showLinearRegressionForm && (
        <div>
          <h2>Linear Regression</h2>
          <form onSubmit={handleLinearRegressionSubmit}>
            <h3>Select Feature Columns</h3>
            {selectedColumns.slice(0, -1).map((column, index) => (
              <div key={index}>
                <label>
                  <input type="checkbox" value={column} checked readOnly />
                  {column}
                </label>
              </div>
            ))}
            <h3>Select Target Column</h3>
            <div>
              <label>
                <input type="checkbox" value={selectedColumns[selectedColumns.length - 1]} checked readOnly />
                {selectedColumns[selectedColumns.length - 1]}
              </label>
            </div>
            <button type="submit">Submit</button>
          </form>
        </div>
      )}

      {mse !== null && (
        <div>
          <h2>MSE Value</h2>
          <p>{mse}</p>
        </div>
      )}

      {head.length > 0 && (
        <div>
          <h2>File Data</h2>
          <table>
            <thead>
              <tr>
                {Object.keys(head[0]).map((key, index) => (
                  <th
                    key={index}
                    style={{
                      backgroundColor: index === 0 ? 'lightblue' : 'white',
                      border: '1px solid black',
                      padding: '8px',
                      textAlign: 'left',
                    }}
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {head.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.keys(row).map((key, index) => (
                    <td
                      key={index}
                      style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'left',
                      }}
                    >
                      {row[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data !== null && (
        <div>
          <div>
            <h2>Data-Type Table</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Category</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.data_types).map(([category, value]) => (
                  <tr key={category}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{category}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2>Missing Values Table</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Category</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Missing Values</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.missing_values).map(([category, value]) => {

                  const numbers = value

                  return (
                    <tr key={category}>
                    <td style={{ border: '1px solid #ddd', padding: '8px', position: 'relative', minWidth: '200px' }}>
                      {category}
                      {Object.entries(data.data_types).find(([cat, type]) => cat === category && (type === 'float64' || type === 'int64')) && numbers !== 0 && (
                        <div style={{ position: 'absolute', left: 'calc(15rem + 10px)', top: '50%', transform: 'translateY(-50%)' }}>
                          <button
                            style={{
                              padding: '6px 16px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                              transition: 'background-color 0.3s ease',
                              zIndex: 1,
                            }}
                            onClick={() => handleNull(category)}
                          >
                            Remove Null Values
                          </button>
                        </div>
                      )}
                      <div style={{ position: 'absolute', left: 'calc(8rem + 10px)', top: '50%', transform: 'translateY(-50%)', zIndex: 0 }}> {/* Ensure span is behind the button */}
                        {Object.entries(data.data_types).map(([cat, value]) => {
                          if (cat === category) {
                            return (
                              <span key={cat} style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '4px', zIndex: 0, whiteSpace: 'nowrap' }}>
                                {value}
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{value}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h2>Unique Values Table</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Category</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Unique Values</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.unique_values).map(([category, value]) => (
                  <tr key={category}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{category}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {Array.isArray(value) ? (
                        <ul style={{ margin: '0', paddingLeft: '15px' }}>
                          {value.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <span>{value}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2>Summary Statistics Table</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th></th>
                  {Object.keys(data.summary_statistics).map((columnName, index) => (
                    <th key={index} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>{columnName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map((statistic, rowIndex) => (
                  <tr key={rowIndex}>
                    <td style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>{statistic}</td>
                    {Object.entries(data.summary_statistics).map(([column, value], cellIndex) => {
                      let parsedData = {};
                      // Remove single quotes and extra quotes around the object value
                      const jsonString = value.replace(/'/g, '"').replace(/^"|"$/g, '');
                      try {
                        // Parse the JSON string into a JavaScript object
                        parsedData = JSON.parse(jsonString);
                      } catch (error) {
                        console.error('Failed to parse JSON:', error);
                      }
                      const statisticValue = parsedData[statistic];
                      return (
                        <td key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {statisticValue !== undefined ? (statisticValue === 0 ? 0 : statisticValue) : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


        </div>
      )}

    </div>
  );
};


export default FileUpload;