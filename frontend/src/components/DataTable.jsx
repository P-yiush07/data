import React from 'react';

const DataTable = ({ data }) => {

    const dataTypes = data.data_types;
    
    return (
        <div>
        <h2>Data Table</h2>
        <table>
            <thead>
                <tr>
                    <th>Feature</th>
                    {Object.keys(dataTypes).map(feature => (
                        <th key={feature}>{feature}</th>
                    ))}
                </tr>
            </thead>
            {/* Content of the table body */}
        </table>
    </div>
    );
};


export default DataTable;
